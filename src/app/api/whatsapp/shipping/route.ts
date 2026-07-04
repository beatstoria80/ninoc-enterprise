/**
 * WhatsApp Shipping Update API
 * POST /api/whatsapp/shipping
 *
 * Called from admin page when order status is changed to "shipped".
 * Updates order status AND sends shipping WhatsApp notification in one call.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendShippingWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailShipping } from '@/lib/email';
import { notifyAllChannels } from '@/lib/notifications';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, tracking_id, courier_name, estimated_delivery } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing required field: order_id' }, { status: 400 });
    }

    // ─── 1. Update order status to shipped ───────────────────────────
    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        status: 'shipped',
        tracking_id: tracking_id || null,
        courier: courier_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('[WhatsApp Shipping API] Order update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // ─── 2. Fetch order details for WA & Email ──────────────────────
    const { data: order } = await adminClient
      .from('orders')
      .select('id, user_id, order_number, shipping_address, customer_name, customer_email, wa_shipping_sent, total_price')
      .eq('id', order_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const shippingAddress = order.shipping_address as Record<string, string> | null;
    const phone = shippingAddress?.phone || '';
    const customerName = order.customer_name || shippingAddress?.name || 'Pelanggan';
    const customerEmail = order.customer_email || shippingAddress?.email;
    const formattedPhone = formatPhoneNumber(phone);

    let waSent = false;
    let messageId = null;
    let waError = null;

    if (!order.wa_shipping_sent && formattedPhone) {
      console.log(`[WhatsApp Shipping API] Sending shipping WA for order ${order_id} to ${formattedPhone}`);
      const waResult = await sendShippingWA({
        phone: formattedPhone,
        customer_name: customerName,
        order_id,
        tracking_id: tracking_id || '',
        courier_name: courier_name || 'NINOC Delivery',
        estimated_delivery,
      });

      waSent = waResult.success;
      messageId = waResult.message_id || null;
      waError = waResult.error || null;

      await adminClient.from('wa_send_log').insert({
        type: 'shipping',
        order_id,
        phone: formattedPhone,
        customer_name: customerName,
        template_name: 'shipping_update',
        status: waResult.success ? 'sent' : 'failed',
        whatsapp_message_id: messageId,
        error_message: waError,
        sent_at: waResult.success ? new Date().toISOString() : null,
      });

      if (waResult.success) {
        await adminClient
          .from('orders')
          .update({
            wa_shipping_sent: true,
            wa_shipping_sent_at: new Date().toISOString(),
            wa_tracking_message_id: messageId,
          })
          .eq('id', order_id);
      }
    }

    // ─── 6. Send Email Shipping Notification ─────────────────────
    if (customerEmail) {
      console.log(`[Shipping API] Sending shipping email for order ${order_id} to ${customerEmail}`);
      await sendEmailShipping(order, customerEmail, tracking_id || 'Otomatis', courier_name || 'Ekspedisi');
    }

    // ─── 7. Send Push & In-App Notification ──────────────────────
    if (order.user_id) {
      await notifyAllChannels({
        userId: order.user_id,
        title: 'Pesanan Dalam Pengiriman',
        message: `Pesanan #${order.order_number || order.id} sedang dalam perjalanan via ${courier_name || 'Kurir'}. Resi: ${tracking_id || '-'}`,
        actionLink: `/profile/orders/${order.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      wa_sent: waSent,
      message_id: messageId,
      error: waError || null,
    });

  } catch (err) {
    console.error('[WhatsApp Shipping API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}