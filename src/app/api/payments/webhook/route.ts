import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { coreApi } from '@/lib/midtrans';
import { sendInvoiceWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailInvoice } from '@/lib/email';
import { notifyAllChannels } from '@/lib/notifications';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAppUrl } from '@/lib/utils';
import { after } from 'next/server';
import { OrderProcessor } from '@/lib/domain/OrderProcessor';

/**
 * Fast-Path Cryptographic Signature Verification (0.1ms local check).
 * Verifies SHA512(order_id + status_code + gross_amount + ServerKey) against Midtrans signature_key.
 * Eliminates synchronous HTTP network roundtrips to Midtrans servers during critical webhook ingestion.
 */
function verifyMidtransSignature(payload: any, serverKey: string): boolean {
  try {
    const { order_id, status_code, gross_amount, signature_key } = payload;
    if (!order_id || !status_code || !gross_amount || !signature_key || !serverKey) {
      return false;
    }
    const hashInput = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const generatedSignature = crypto.createHash('sha512').update(hashInput).digest('hex');
    return generatedSignature.toLowerCase() === signature_key.toLowerCase();
  } catch (err) {
    console.error('[Payment Webhook] Signature verification error:', err);
    return false;
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const notificationJson = await req.json();

    if (!notificationJson || !notificationJson.order_id || !notificationJson.transaction_status) {
      console.warn('[Payment Webhook] Received malformed webhook payload:', notificationJson);
      return NextResponse.json({ error: 'Malformed webhook payload' }, { status: 400 });
    }

    const orderId = notificationJson.order_id;
    const transactionId = notificationJson.transaction_id || '';
    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;

    // 1. Authenticate Webhook Notification
    // Primary Fast-Path: Cryptographic SHA512 signature check using local environment secret
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    let isVerified = verifyMidtransSignature(notificationJson, serverKey);

    // Fallback: If SHA512 mismatch (e.g. gross_amount decimal variance), verify via Midtrans CoreApi
    if (!isVerified) {
      console.warn(`[Payment Webhook] SHA512 signature mismatch for Order ${orderId}. Attempting fallback CoreApi verification...`);
      try {
        const remoteStatus = await coreApi.transaction.notification(notificationJson);
        if (remoteStatus && remoteStatus.order_id === orderId) {
          isVerified = true;
        }
      } catch (apiErr) {
        console.error(`[Payment Webhook] CoreApi verification failed for Order ${orderId}:`, apiErr);
      }
    }

    if (!isVerified) {
      console.error(`[Payment Webhook] SECURITY ALERT: Unauthenticated webhook payload rejected for Order ${orderId}`);
      return NextResponse.json({ error: 'Unauthenticated webhook signature' }, { status: 403 });
    }

    console.log(`[Payment Webhook] Ingesting Order: ${orderId} | TX: ${transactionId} | Status: ${transactionStatus} | Fraud: ${fraudStatus}`);

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Validate Order Exists in Database
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, midtrans_id, wa_invoice_sent, user_id, shipping_address, total_price, affiliate_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.warn(`[Payment Webhook] Order ${orderId} not found in DB (test transaction or legacy order). Acknowledging HTTP 200 OK.`);
      return NextResponse.json({ status: 'OK', note: `Order ${orderId} not found; acknowledged to prevent Midtrans retries` }, { status: 200 });
    }

    const previousStatus = existingOrder.status;

    // 3. Strict Terminal State Idempotency Protection
    if (previousStatus === 'paid' || previousStatus === 'cancelled') {
      if (existingOrder.midtrans_id === transactionId || transactionStatus === 'pending' || transactionStatus === 'capture') {
        console.log(`[Payment Webhook] Idempotency guard: Order ${orderId} is already in terminal state (${previousStatus}). Skipping duplicate webhook.`);
        return NextResponse.json({ status: 'OK', note: `Already terminal: ${previousStatus}` }, { status: 200 });
      }
    }

    let orderUpdateStatus = '';
    if (transactionStatus === 'capture') {
      orderUpdateStatus = fraudStatus === 'challenge' ? 'pending' : 'paid';
    } else if (transactionStatus === 'settlement') {
      orderUpdateStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      orderUpdateStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      orderUpdateStatus = 'pending';
    }

    if (!orderUpdateStatus || orderUpdateStatus === previousStatus) {
      return NextResponse.json({ status: 'OK', note: 'No state transition required' }, { status: 200 });
    }

    // 4. Atomic Status Update in Database
    const paymentType = notificationJson.payment_type || '';
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: orderUpdateStatus,
        payment_status: orderUpdateStatus === 'paid' ? 'success' : orderUpdateStatus === 'cancelled' ? 'failed' : 'pending',
        payment_method: paymentType,
        midtrans_id: transactionId,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error(`[Payment Webhook] Supabase update failed for Order ${orderId}:`, updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`[Payment Webhook] Order ${orderId} transitioned: ${previousStatus} -> ${orderUpdateStatus} in ${Date.now() - startTime}ms`);

    // 5. Decoupled Asynchronous Tasks (Non-Blocking execution after core DB transition)
    after(async () => {
      try {
        // --- INVENTORY RESTOCK (Only on transition into cancelled) ---
        if (orderUpdateStatus === 'cancelled' && previousStatus !== 'cancelled') {
          await OrderProcessor.processCancelledOrder(orderId, existingOrder);
        }

        // --- FINANCIAL DISTRIBUTION & NOTIFICATIONS (When order becomes PAID) ---
        if (orderUpdateStatus === 'paid' && previousStatus !== 'paid') {
          const grossAmount = Number(notificationJson.gross_amount || existingOrder.total_price || 0);
          await OrderProcessor.processSuccessfulOrder(orderId, existingOrder, paymentType, grossAmount);
        }
      } catch (asyncErr) {
        console.error(`[Payment Webhook Async] Unhandled error in asynchronous background processing for Order ${orderId}:`, asyncErr);
      }
    });

    // Return immediate HTTP 200 OK to satisfy Midtrans 10s timeout SLA
    return NextResponse.json({
      status: 'OK',
      order_id: orderId,
      new_status: orderUpdateStatus,
      duration_ms: Date.now() - startTime
    }, { status: 200 });

  } catch (err) {
    const error = err as Error;
    console.error('[Payment Webhook] Fatal Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'NINOC Midtrans Webhook Endpoint is Active (HTTPS Enforced)',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
