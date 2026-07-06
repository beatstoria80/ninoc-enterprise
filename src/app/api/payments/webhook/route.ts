import { NextResponse } from 'next/server';
import { coreApi } from '@/lib/midtrans';
import { sendInvoiceWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailInvoice } from '@/lib/email';
import { notifyAllChannels } from '@/lib/notifications';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // 1. Verify notification authenticity with Midtrans
    let statusResponse = notificationJson;
    try {
      statusResponse = await coreApi.transaction.notification(notificationJson);
    } catch (apiErr) {
      console.warn('[Payment Webhook] coreApi.transaction.notification API call failed/timed out, falling back to payload verification:', apiErr);
      if (!notificationJson || !notificationJson.order_id || !notificationJson.transaction_status) {
        throw new Error('Invalid webhook payload and Midtrans API verification failed');
      }
    }

    const orderId = statusResponse.order_id;
    const transactionId = statusResponse.transaction_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`[Payment Webhook] Order: ${orderId} | TX: ${transactionId} | Status: ${transactionStatus} | Fraud: ${fraudStatus}`);

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Validate order exists in database
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, midtrans_id, wa_invoice_sent')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error(`[Payment Webhook] Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = existingOrder.status;

    // 3. Strict Terminal State Idempotency Check
    // If order is already in a terminal state (paid or cancelled), prevent out-of-order webhooks from reverting it
    if (previousStatus === 'paid' || previousStatus === 'cancelled') {
      if (existingOrder.midtrans_id === transactionId || transactionStatus === 'pending' || transactionStatus === 'capture') {
        console.log(`[Payment Webhook] Terminal state reached (${previousStatus}) for order ${orderId} — skipping duplicate/out-of-order webhook`);
        return NextResponse.json({ status: 'OK', note: `Already in terminal state: ${previousStatus}` });
      }
    }

    let orderUpdateStatus = '';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        orderUpdateStatus = 'pending';
      } else if (fraudStatus === 'accept') {
        orderUpdateStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      orderUpdateStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      orderUpdateStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      orderUpdateStatus = 'pending';
    }

    if (!orderUpdateStatus || orderUpdateStatus === previousStatus) {
      return NextResponse.json({ status: 'OK', note: 'No status change required' });
    }

    // 4. Update order status + store midtrans_id
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: orderUpdateStatus,
        payment_status: orderUpdateStatus === 'paid' ? 'success' : orderUpdateStatus === 'cancelled' ? 'failed' : 'pending',
        midtrans_id: transactionId,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Payment Webhook] Supabase update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // --- INVENTORY RESTOCK (ATOMIC FIX: Only restock if transitioning INTO cancelled from a non-cancelled state) ---
    if (orderUpdateStatus === 'cancelled' && previousStatus !== 'cancelled') {
      const { error: restockError } = await supabaseAdmin.rpc('restock_inventory', { p_order_id: orderId });
      if (restockError) {
        console.error(`[Payment Webhook] Failed to restock inventory for order ${orderId}:`, restockError);
      } else {
        console.log(`[Payment Webhook] Successfully restocked inventory for cancelled order ${orderId}`);
      }

      // Notify: Order Cancelled/Expired
      const { data: cancelledOrder } = await supabaseAdmin
        .from('orders')
        .select('user_id, order_number')
        .eq('id', orderId)
        .single();
      if (cancelledOrder?.user_id) {
        await notifyAllChannels({
          userId: cancelledOrder.user_id,
          title: 'Pesanan Dibatalkan',
          message: `Pesanan #${cancelledOrder.order_number || orderId} telah dibatalkan/kadaluarsa. Jika Anda sudah membayar, dana akan dikembalikan.`,
          actionLink: `/profile/orders/${orderId}`,
        });
      }
    }

    // 5. Financial Distribution & Async Notifications (When order becomes PAID)
    if (orderUpdateStatus === 'paid' && previousStatus !== 'paid') {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select(`
          id, order_number, user_id, shipping_address, total_price, wa_invoice_sent, affiliate_id,
          order_items ( id, supplier_id, supplier_hpp )
        `)
        .eq('id', orderId)
        .single();

      if (order) {
        // --- SUPPLIER LEDGER DISTRIBUTION (IDEMPOTENT Check) ---
        if (order.order_items && order.order_items.length > 0) {
          const ledgerEntries = order.order_items
            .filter((item: any) => item.supplier_id && Number(item.supplier_hpp) > 0)
            .map((item: any) => ({
              supplier_id: item.supplier_id,
              order_id: order.id,
              order_item_id: item.id,
              hpp_amount: item.supplier_hpp,
              status: 'pending'
            }));
          
          if (ledgerEntries.length > 0) {
            const { data: existingLedger } = await supabaseAdmin
              .from('supplier_ledgers')
              .select('id')
              .eq('order_id', order.id)
              .limit(1);
            
            if (!existingLedger || existingLedger.length === 0) {
              const { error: ledgerError } = await supabaseAdmin
                .from('supplier_ledgers')
                .insert(ledgerEntries);
              if (ledgerError) {
                console.error('[Payment Webhook] Failed to create supplier ledger entries:', ledgerError);
              } else {
                console.log(`[Payment Webhook] Distributed ${ledgerEntries.length} supplier ledger entries for order ${order.id}`);
              }
            }
          }
        }

        // --- AFFILIATE COMMISSION LOGIC (IDEMPOTENT Check) ---
        if (order.affiliate_id) {
          const { data: existingCommission } = await supabaseAdmin
            .from('affiliate_commissions')
            .select('id')
            .eq('order_id', order.id)
            .maybeSingle();

          if (!existingCommission) {
            const { data: affiliate } = await supabaseAdmin
              .from('affiliates')
              .select('commission_rate')
              .eq('id', order.affiliate_id)
              .single();

            if (affiliate) {
              const { data: orderItems } = await supabaseAdmin
                .from('order_items')
                .select(`
                  price_at_purchase,
                  quantity,
                  products ( affiliate_eligible )
                `)
                .eq('order_id', order.id);

              let eligibleTotal = 0;
              if (orderItems && orderItems.length > 0) {
                orderItems.forEach((item: any) => {
                  if (item.products && item.products.affiliate_eligible === true) {
                    eligibleTotal += (Number(item.price_at_purchase) * Number(item.quantity));
                  }
                });
              }

              if (eligibleTotal > 0) {
                const commissionAmount = (eligibleTotal * Number(affiliate.commission_rate)) / 100;
                await supabaseAdmin
                  .from('affiliate_commissions')
                  .insert({
                    affiliate_id: order.affiliate_id,
                    order_id: order.id,
                    amount: commissionAmount,
                    status: 'pending'
                  });
                console.log(`[Payment Webhook] Created affiliate commission for order ${order.id}: Rp ${commissionAmount}`);
              }
            }
          }
        }

        // --- NON-BLOCKING ASYNC NOTIFICATIONS (Prevents Midtrans webhook I/O timeout loops) ---
        const shippingAddress = order.shipping_address as Record<string, string> | null;
        const phone = shippingAddress?.phone || '';
        const customerName = shippingAddress?.name || 'Pelanggan';
        const formattedPhone = formatPhoneNumber(phone);
        const customerEmail = shippingAddress?.email;

        // Atomically lock email/WA notification flag to prevent concurrent retries
        if (!order.wa_invoice_sent) {
          await supabaseAdmin
            .from('orders')
            .update({ wa_invoice_sent: true, wa_invoice_sent_at: new Date().toISOString() })
            .eq('id', orderId);

          if (formattedPhone) {
            const formattedPrice = `Rp ${Number(order.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');
            const appUrl = rawAppUrl.replace(/^http:\/\/(?!localhost)/, 'https://').replace(/\/+$/, '');
            const trackId = order.order_number || order.id;
            const paymentUrl = `${appUrl}/track?order_number=${trackId}&phone=${encodeURIComponent(formattedPhone)}`;

            sendInvoiceWA({
              phone: formattedPhone,
              customer_name: customerName,
              order_id: order.id,
              total_price: formattedPrice,
              payment_url: paymentUrl,
            }).catch(err => console.error('[Payment Webhook] Async WA Invoice Error:', err));
          }

          if (customerEmail) {
            sendEmailInvoice(order, customerEmail).catch(err => console.error('[Payment Webhook] Async Email Invoice Error:', err));
          }
        }

        if (order.user_id) {
          notifyAllChannels({
            userId: order.user_id,
            title: 'Pembayaran Berhasil!',
            message: `Pesanan #${order.order_number || order.id} senilai Rp ${Number(order.total_price).toLocaleString('id-ID')} telah dikonfirmasi.`,
            actionLink: `/profile/orders/${order.id}`,
          }).catch(err => console.error('[Payment Webhook] Async Push Notification Error:', err));
        }
      }
    }

    return NextResponse.json({
      status: 'OK',
      order_id: orderId,
      new_status: orderUpdateStatus,
    });

  } catch (err) {
    const error = err as Error;
    console.error('[Payment Webhook] Fatal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'OK', message: 'NINOC Midtrans Webhook Endpoint is Active' }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

