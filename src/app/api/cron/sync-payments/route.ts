import { NextResponse } from 'next/server';
import { coreApi } from '@/lib/midtrans';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';


import { sendInvoiceWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailInvoice } from '@/lib/email';
import { getAppUrl } from '@/lib/utils';

/**
 * CRON: Sync Pending Payments with Midtrans
 * 
 * Safety net for when webhooks fail or are misconfigured.
 * Checks all pending orders against Midtrans API and syncs status.
 * 
 * Can also be triggered manually: GET /api/cron/sync-payments
 */
export async function GET() {
  try {
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

        // 4. Update order status
        const { error: updateError } = await adminClient
          .from('orders')
          .update({
            status: newStatus,
            payment_status: newStatus === 'paid' ? 'success' : newStatus === 'cancelled' ? 'failed' : 'pending',
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

        // 5. If paid, trigger notifications (same logic as webhook)
        if (newStatus === 'paid') {
          const { data: fullOrder } = await adminClient
            .from('orders')
            .select(`
              id, order_number, shipping_address, total_price, wa_invoice_sent,
              order_items ( id, product_name, size, quantity, price_at_purchase, supplier_id, supplier_hpp )
            `)
            .eq('id', order.id)
            .single();

          if (fullOrder) {
            // Send WhatsApp Invoice
            if (!fullOrder.wa_invoice_sent) {
              const shippingAddress = fullOrder.shipping_address as Record<string, string> | null;
              const phone = shippingAddress?.phone || '';
              const customerName = shippingAddress?.name || 'Pelanggan';
              const formattedPhone = formatPhoneNumber(phone);

              if (formattedPhone) {
                const formattedPrice = `Rp ${Number(fullOrder.total_price).toLocaleString('id-ID')}`;
                const appUrl = getAppUrl();
                const trackId = fullOrder.order_number || fullOrder.id;
                const paymentUrl = `${appUrl}/track?order_number=${trackId}&phone=${encodeURIComponent(formattedPhone)}`;

                const waResult = await sendInvoiceWA({
                  phone: formattedPhone,
                  customer_name: customerName,
                  order_id: fullOrder.id,
                  total_price: formattedPrice,
                  payment_url: paymentUrl,
                });

                if (waResult.success) {
                  await adminClient
                    .from('orders')
                    .update({ wa_invoice_sent: true, wa_invoice_sent_at: new Date().toISOString() })
                    .eq('id', order.id);
                  console.log(`[Sync Payments] WA invoice sent for order ${order.id}`);
                }
              }
            }

            // Send Email Invoice
            const customerEmail = (fullOrder.shipping_address as Record<string, string> | null)?.email;
            if (customerEmail) {
              console.log(`[Sync Payments] Sending email invoice to ${customerEmail}`);
              await sendEmailInvoice(fullOrder, customerEmail);
            }
          }
        }

        // 6. Restock if cancelled
        if (newStatus === 'cancelled') {
          const { error: restockError } = await adminClient.rpc('restock_inventory', { p_order_id: order.id });
          if (!restockError) {
            console.log(`[Sync Payments] Restocked inventory for cancelled order ${order.id}`);
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

