import { NextResponse } from 'next/server';
import { coreApi } from '@/lib/midtrans';
import { supabase } from '@/lib/supabase';
import { sendInvoiceWA, formatPhoneNumber } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // 1. Verify notification authenticity with Midtrans
    const statusResponse = await coreApi.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionId = statusResponse.transaction_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`[Payment Webhook] Order: ${orderId} | TX: ${transactionId} | Status: ${transactionStatus} | Fraud: ${fraudStatus}`);

    // 2. Validate order exists in database
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, midtrans_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error(`[Payment Webhook] Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. Idempotency check — skip if already processed with same transaction_id
    if (existingOrder.midtrans_id === transactionId) {
      console.log(`[Payment Webhook] Duplicate webhook for order ${orderId}, transaction ${transactionId} — skipping`);
      return NextResponse.json({ status: 'OK', note: 'Already processed' });
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

    if (!orderUpdateStatus) {
      return NextResponse.json({ status: 'OK', note: 'No status change' });
    }

    // 4. Update order status + store midtrans_id and payment_type
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderUpdateStatus,
        midtrans_id: transactionId,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Payment Webhook] Supabase update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // --- INVENTORY RESTOCK (IF CANCELLED/EXPIRED) ---
    if (orderUpdateStatus === 'cancelled') {
      const { error: restockError } = await supabase.rpc('restock_inventory', { p_order_id: orderId });
      if (restockError) {
        console.error(`[Payment Webhook] Failed to restock inventory for order ${orderId}:`, restockError);
      } else {
        console.log(`[Payment Webhook] Successfully restocked inventory for cancelled order ${orderId}`);
      }
    }

    // 5. Send WhatsApp Invoice Notification, Generate Affiliate Commission, and Distribute Supplier Ledger
    if (orderUpdateStatus === 'paid') {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id, shipping_address, total_price, wa_invoice_sent, affiliate_id,
          order_items ( id, supplier_id, supplier_hpp )
        `)
        .eq('id', orderId)
        .single();

      if (order) {
        // --- SUPPLIER LEDGER DISTRIBUTION ---
        if (order.order_items && order.order_items.length > 0) {
          const ledgerEntries = order.order_items
            .filter((item: any) => item.supplier_id && item.supplier_hpp > 0)
            .map((item: any) => ({
              supplier_id: item.supplier_id,
              order_id: order.id,
              order_item_id: item.id,
              hpp_amount: item.supplier_hpp,
              status: 'pending' // clears after 14 days or whatever policy says
            }));
          
          if (ledgerEntries.length > 0) {
            // Check if already created
            const { data: existingLedger } = await supabase
              .from('supplier_ledgers')
              .select('id')
              .eq('order_id', order.id)
              .limit(1);
            
            if (!existingLedger || existingLedger.length === 0) {
              const { error: ledgerError } = await supabase
                .from('supplier_ledgers')
                .insert(ledgerEntries);
              if (ledgerError) console.error('[Payment Webhook] Failed to create supplier ledger entries:', ledgerError);
              else console.log(`[Payment Webhook] Distributed ${ledgerEntries.length} supplier ledger entries for order ${order.id}`);
            }
          }
        }
        // --- AFFILIATE COMMISSION LOGIC ---
        if (order.affiliate_id) {
          const { data: existingCommission } = await supabase
            .from('affiliate_commissions')
            .select('id')
            .eq('order_id', order.id)
            .maybeSingle();

          if (!existingCommission) {
            const { data: affiliate } = await supabase
              .from('affiliates')
              .select('commission_rate')
              .eq('id', order.affiliate_id)
              .single();

            if (affiliate) {
              // Fraud Prevention: Only calculate commission on eligible products
              const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                  price_at_purchase,
                  quantity,
                  products (
                    affiliate_eligible
                  )
                `)
                .eq('order_id', order.id);

              let eligibleTotal = 0;
              if (orderItems && orderItems.length > 0) {
                orderItems.forEach((item: any) => {
                  // Check if the joined product explicitly allows affiliate commissions
                  if (item.products && item.products.affiliate_eligible === true) {
                    eligibleTotal += (Number(item.price_at_purchase) * Number(item.quantity));
                  }
                });
              }

              if (eligibleTotal > 0) {
                const commissionAmount = (eligibleTotal * Number(affiliate.commission_rate)) / 100;
                await supabase
                  .from('affiliate_commissions')
                  .insert({
                    affiliate_id: order.affiliate_id,
                    order_id: order.id,
                    amount: commissionAmount,
                    status: 'pending'
                  });
                console.log(`[Payment Webhook] Created affiliate commission for order ${order.id}: Rp ${commissionAmount} (Eligible Base: Rp ${eligibleTotal})`);
              } else {
                console.log(`[Payment Webhook] No eligible products for affiliate commission on order ${order.id}`);
              }
            }
          }
        }

        if (!order.wa_invoice_sent) {
          const shippingAddress = order.shipping_address as Record<string, string> | null;
          const phone = shippingAddress?.phone || '';
          const customerName = shippingAddress?.name || 'Pelanggan';
          const formattedPhone = formatPhoneNumber(phone);

        if (formattedPhone) {
          const formattedPrice = `Rp ${Number(order.total_price).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`;

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
          const paymentUrl = `${appUrl}/profile/orders/${order.id}`;

          console.log(`[Payment Webhook] Sending invoice WA to ${formattedPhone} for order ${order.id}`);

          const waResult = await sendInvoiceWA({
            phone: formattedPhone,
            customer_name: customerName,
            order_id: order.id,
            total_price: formattedPrice,
            payment_url: paymentUrl,
          });

          if (waResult.success) {
            console.log(`[Payment Webhook] Invoice WA sent. Message ID: ${waResult.message_id}`);
            // Only mark as sent if WhatsApp actually succeeded
            await supabase
              .from('orders')
              .update({
                wa_invoice_sent: true,
                wa_invoice_sent_at: new Date().toISOString(),
              })
              .eq('id', orderId);
          } else {
            console.warn(`[Payment Webhook] Invoice WA failed: ${waResult.error}`);
          }
        } else {
          console.warn(`[Payment Webhook] No valid phone number for order ${order.id}`);
        }
        } else {
          console.log(`[Payment Webhook] Invoice WA already sent for order ${order.id}, skipping`);
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
    console.error('[Payment Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
