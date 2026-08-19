import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { coreApi } from '@/lib/midtrans';
import { sendInvoiceWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailInvoice } from '@/lib/email';
import { notifyAllChannels } from '@/lib/notifications';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAppUrl } from '@/lib/utils';
import { after } from 'next/server';

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
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: orderUpdateStatus,
        payment_status: orderUpdateStatus === 'paid' ? 'success' : orderUpdateStatus === 'cancelled' ? 'failed' : 'pending',
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
          const { error: restockError } = await supabaseAdmin.rpc('restock_inventory', { p_order_id: orderId });
          if (restockError) {
            console.error(`[Payment Webhook Async] Inventory restock failed for Order ${orderId}:`, restockError);
          } else {
            console.log(`[Payment Webhook Async] Restocked inventory for cancelled Order ${orderId}`);
          }
          if (existingOrder.user_id) {
            await notifyAllChannels({
              userId: existingOrder.user_id,
              title: 'Pesanan Dibatalkan',
              message: `Pesanan #${existingOrder.order_number || orderId} telah dibatalkan/kadaluarsa. Jika sudah membayar, dana akan diproses refund.`,
              actionLink: `/profile/orders/${orderId}`,
            }).catch(e => console.error('[Payment Webhook Async] Cancel notify error:', e));
          }
        }

        // --- FINANCIAL DISTRIBUTION & NOTIFICATIONS (When order becomes PAID) ---
        if (orderUpdateStatus === 'paid' && previousStatus !== 'paid') {
          // A. Secure Voucher Consumption (Financial integrity)
          const appliedPromo = (existingOrder.shipping_address as any)?.promo_code;
          if (appliedPromo) {
            console.log(`[Payment Webhook Async] Consuming voucher quota securely for promo: ${appliedPromo}`);
            const { data: voucher } = await supabaseAdmin
              .from('vouchers')
              .select('id, usage_count')
              .eq('code', appliedPromo)
              .single();
            if (voucher) {
              await supabaseAdmin
                .from('vouchers')
                .update({ usage_count: (voucher.usage_count || 0) + 1 })
                .eq('id', voucher.id);
            }
          }

          // B. Fetch order items for supplier ledgers & affiliate commissions
          const { data: orderItems } = await supabaseAdmin
            .from('order_items')
            .select('id, supplier_id, supplier_hpp, price_at_purchase, quantity, products ( supplier_id, affiliate_eligible )')
            .eq('order_id', orderId);

          // B. Supplier Ledgers Distribution (Double-Entry Virtual Inventory)
          if (orderItems && orderItems.length > 0) {
            const { data: existingLedger } = await supabaseAdmin
              .from('supplier_ledgers')
              .select('id')
              .eq('order_id', orderId)
              .limit(1);

            if (!existingLedger || existingLedger.length === 0) {
              const ledgerEntries: any[] = [];
              
              // 1. Fetch Active Campaigns
              const supplierIds = [...new Set(orderItems.map((i: any) => i.supplier_id || i.products?.supplier_id).filter(Boolean))];
              let activeCampaigns: any[] = [];
              if (supplierIds.length > 0) {
                const { data: campaigns } = await supabaseAdmin
                  .from('supplier_campaign_agreements')
                  .select('*')
                  .in('supplier_id', supplierIds)
                  .eq('is_active', true);
                if (campaigns) activeCampaigns = campaigns;
              }

              orderItems.forEach((item: any) => {
                const sId = item.supplier_id || item.products?.supplier_id;
                const hpp = Number(item.supplier_hpp);
                if (sId && hpp > 0) {
                  // Revenue Entry (Total HPP)
                  ledgerEntries.push({
                    supplier_id: sId,
                    order_id: orderId,
                    order_item_id: item.id,
                    transaction_type: 'SALES_REVENUE',
                    amount: hpp * item.quantity,
                    description: `Virtual Inventory Revenue (Order ${orderId})`,
                    status: 'pending'
                  });

                  // Check if this supplier has an active campaign deduction
                  const campaign = activeCampaigns.find(c => c.supplier_id === sId);
                  if (campaign) {
                    let deduction = 0;
                    if (Number(campaign.cogs_deduction_amount) > 0) {
                      deduction = Number(campaign.cogs_deduction_amount) * item.quantity;
                    } else if (Number(campaign.cogs_deduction_percentage) > 0) {
                      deduction = (hpp * (Number(campaign.cogs_deduction_percentage) / 100)) * item.quantity;
                    }

                    if (deduction > 0) {
                      ledgerEntries.push({
                        supplier_id: sId,
                        order_id: orderId,
                        order_item_id: item.id,
                        transaction_type: 'CAMPAIGN_FEE',
                        amount: deduction,
                        description: `Campaign Deduction: ${campaign.campaign_name}`,
                        status: 'pending'
                      });
                    }
                  }
                }
              });

              if (ledgerEntries.length > 0) {
                await supabaseAdmin.from('supplier_ledgers').insert(ledgerEntries);
                console.log(`[Payment Webhook Async] Created ${ledgerEntries.length} virtual inventory ledger entries for Order ${orderId}`);
              }
            }
          }

          // C. Affiliate Commission Calculation (Idempotent check)
          if (existingOrder.affiliate_id && orderItems && orderItems.length > 0) {
            const { data: existingComm } = await supabaseAdmin
              .from('affiliate_commissions')
              .select('id')
              .eq('order_id', orderId)
              .maybeSingle();

            if (!existingComm) {
              const { data: affiliate } = await supabaseAdmin
                .from('affiliates')
                .select('commission_rate')
                .eq('id', existingOrder.affiliate_id)
                .single();

              if (affiliate) {
                let eligibleTotal = 0;
                orderItems.forEach((item: any) => {
                  if (item.products && item.products.affiliate_eligible === true) {
                    eligibleTotal += (Number(item.price_at_purchase) * Number(item.quantity));
                  }
                });

                if (eligibleTotal > 0) {
                  const commAmount = (eligibleTotal * Number(affiliate.commission_rate)) / 100;
                  await supabaseAdmin.from('affiliate_commissions').insert({
                    affiliate_id: existingOrder.affiliate_id,
                    order_id: orderId,
                    amount: commAmount,
                    status: 'pending'
                  });
                  console.log(`[Payment Webhook Async] Created affiliate commission Rp ${commAmount} for Order ${orderId}`);
                }
              }
            }
          }

          // D. Customer Notifications (WhatsApp Invoice, Email & Push)
          const shippingAddress = existingOrder.shipping_address as Record<string, string> | null;
          const phone = shippingAddress?.phone || '';
          const customerName = shippingAddress?.name || 'Pelanggan';
          const formattedPhone = formatPhoneNumber(phone);
          const customerEmail = shippingAddress?.email;

          if (!existingOrder.wa_invoice_sent) {
            await supabaseAdmin
              .from('orders')
              .update({ wa_invoice_sent: true, wa_invoice_sent_at: new Date().toISOString() })
              .eq('id', orderId);

            if (formattedPhone) {
              const formattedPrice = `Rp ${Number(existingOrder.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              const appUrl = getAppUrl();
              const trackId = existingOrder.order_number || orderId;
              const paymentUrl = `${appUrl}/track?order_number=${trackId}&phone=${encodeURIComponent(formattedPhone)}`;

              sendInvoiceWA({
                phone: formattedPhone,
                customer_name: customerName,
                order_id: orderId,
                total_price: formattedPrice,
                payment_url: paymentUrl,
              }).catch(err => console.error('[Payment Webhook Async] WA Invoice Error:', err));
            }

            if (customerEmail) {
              sendEmailInvoice(existingOrder, customerEmail).catch(err => console.error('[Payment Webhook Async] Email Invoice Error:', err));
            }
          }

          if (existingOrder.user_id) {
            notifyAllChannels({
              userId: existingOrder.user_id,
              title: 'Pembayaran Berhasil!',
              message: `Pesanan #${existingOrder.order_number || orderId} senilai Rp ${Number(existingOrder.total_price).toLocaleString('id-ID')} telah dikonfirmasi.`,
              actionLink: `/profile/orders/${orderId}`,
            }).catch(err => console.error('[Payment Webhook Async] Push Notification Error:', err));
          }

          // E. Record Midtrans Gateway Fee as OPEX (NINOC Absorbs Platform Fee)
          const paymentType = notificationJson.payment_type || '';
          const grossAmount = Number(notificationJson.gross_amount || existingOrder.total_price || 0);
          let midtransFee = 0;

          if (paymentType === 'qris' || paymentType === 'gopay') {
            midtransFee = grossAmount * 0.007; // 0.7%
          } else if (paymentType === 'bank_transfer' || paymentType === 'echannel' || paymentType === 'cstore') {
            midtransFee = 4440; // Flat Rp 4000 + 11% PPN
          } else if (paymentType === 'credit_card') {
            midtransFee = (grossAmount * 0.029) + 2000;
          } else {
            midtransFee = 4440; // Fallback
          }

          if (midtransFee > 0) {
            const roundedFee = Math.round(midtransFee);
            const { error: opexError } = await supabaseAdmin.from('operational_expenses').insert({
              category: 'payment_gateway',
              description: `Fee Midtrans Order #${existingOrder.order_number || orderId} (${paymentType.toUpperCase()})`,
              amount: roundedFee,
              expense_date: new Date().toISOString().slice(0, 10),
              created_by: 'system@ninoc.store'
            });
            if (opexError) {
              console.error(`[Payment Webhook Async] Failed to insert OPEX for Order ${orderId}:`, opexError);
            } else {
              console.log(`[Payment Webhook Async] Logged Midtrans OPEX Rp ${roundedFee} for Order ${orderId}`);
            }
          }
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
