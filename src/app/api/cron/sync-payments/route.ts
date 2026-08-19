import { NextResponse } from 'next/server';
import { coreApi } from '@/lib/midtrans';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';


import { sendInvoiceWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailInvoice } from '@/lib/email';
import { getAppUrl } from '@/lib/utils';
import { OrderProcessor } from '@/lib/domain/OrderProcessor';
/**
 * CRON: Sync Pending Payments with Midtrans
 * 
 * Safety net for when webhooks fail or are misconfigured.
 * Checks all pending orders against Midtrans API and syncs status.
 * 
 * Can also be triggered manually: GET /api/cron/sync-payments
 */
export async function GET(req: Request) {
  try {
    // 1. Verify cron secret (if running in Vercel)
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET) {
      console.warn('[Sync Payments] CRON_SECRET is not set in environment variables! Allowing execution but this is unsafe.');
    } else if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // 1. Fetch all pending orders that have a snap_token (meaning they were sent to Midtrans)
    const { data: pendingOrders, error: fetchError } = await adminClient
      .from('orders')
      .select('id, status, midtrans_id, snap_token, created_at')
      .eq('status', 'pending')
      .not('snap_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('[Sync Payments] Failed to fetch pending orders:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({ status: 'OK', message: 'No pending orders to sync', synced: 0 });
    }

    console.log(`[Sync Payments] Found ${pendingOrders.length} pending orders to check`);

    let syncedCount = 0;
    const results: Array<{ orderId: string; midtransStatus: string; newStatus: string }> = [];

    for (const order of pendingOrders) {
      try {
        // 2. Check status directly from Midtrans API
        const statusResponse = await (coreApi.transaction as any).status(order.id);

        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        const transactionId = statusResponse.transaction_id;
        const paymentType = statusResponse.payment_type || '';

        console.log(`[Sync Payments] Order ${order.id}: Midtrans status=${transactionStatus}, fraud=${fraudStatus}`);

        // 3. Map Midtrans status to our order status
        let newStatus = '';
        if (transactionStatus === 'capture' && fraudStatus === 'accept') {
          newStatus = 'paid';
        } else if (transactionStatus === 'settlement') {
          newStatus = 'paid';
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
          newStatus = 'cancelled';
        } else if (transactionStatus === 'pending') {
          // Still pending at Midtrans, skip
          results.push({ orderId: order.id, midtransStatus: transactionStatus, newStatus: 'still_pending' });
          continue;
        }

        if (!newStatus || newStatus === order.status) {
          results.push({ orderId: order.id, midtransStatus: transactionStatus, newStatus: 'no_change' });
          continue;
        }

        const { error: updateError } = await adminClient
          .from('orders')
          .update({
            status: newStatus,
            payment_status: newStatus === 'paid' ? 'success' : newStatus === 'cancelled' ? 'failed' : 'pending',
            payment_method: paymentType,
            midtrans_id: transactionId,
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[Sync Payments] Failed to update order ${order.id}:`, updateError);
          continue;
        }

        syncedCount++;
        results.push({ orderId: order.id, midtransStatus: transactionStatus, newStatus });

        console.log(`[Sync Payments] ✅ Order ${order.id} synced: pending → ${newStatus}`);

        // 5. Trigger side effects using unified domain service
        if (newStatus === 'paid') {
          const { data: fullOrder } = await adminClient
            .from('orders')
            .select('id, order_number, status, midtrans_id, wa_invoice_sent, user_id, shipping_address, total_price, affiliate_id')
            .eq('id', order.id)
            .single();

          if (fullOrder) {
            // Midtrans status API doesn't return gross_amount consistently, fallback to order total
            const grossAmount = statusResponse.gross_amount ? Number(statusResponse.gross_amount) : Number(fullOrder.total_price || 0);
            await OrderProcessor.processSuccessfulOrder(order.id, fullOrder, paymentType, grossAmount);
          }
        } else if (newStatus === 'cancelled') {
          const { data: fullOrder } = await adminClient
            .from('orders')
            .select('id, order_number, status, midtrans_id, wa_invoice_sent, user_id, shipping_address, total_price, affiliate_id')
            .eq('id', order.id)
            .single();

          if (fullOrder) {
            await OrderProcessor.processCancelledOrder(order.id, fullOrder);
          }
        }

      } catch (midtransError: any) {
        // 404 from Midtrans = transaction not found (customer never paid)
        if (midtransError?.httpStatusCode === 404) {
          console.log(`[Sync Payments] Order ${order.id}: Not found in Midtrans (customer never paid)`);
          results.push({ orderId: order.id, midtransStatus: 'not_found', newStatus: 'skipped' });
        } else {
          console.error(`[Sync Payments] Error checking order ${order.id}:`, midtransError);
        }
      }
    }

    return NextResponse.json({
      status: 'OK',
      checked: pendingOrders.length,
      synced: syncedCount,
      results,
    });

  } catch (err) {
    const error = err as Error;
    console.error('[Sync Payments] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

