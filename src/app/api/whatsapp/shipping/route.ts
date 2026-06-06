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

    // ─── 2. Fetch order details for WA ──────────────────────────────
    const { data: order } = await adminClient
      .from('orders')
      .select('shipping_address, wa_shipping_sent, total_price')
      .eq('id', order_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Skip if WA already sent
    if (order.wa_shipping_sent) {
      console.log(`[WhatsApp Shipping API] WA already sent for order ${order_id}`);
      return NextResponse.json({ success: true, skipped: true, reason: 'Already sent' });
    }

    const shippingAddress = order.shipping_address as Record<string, string> | null;
    const phone = shippingAddress?.phone || '';
    const customerName = shippingAddress?.name || 'Pelanggan';
    const formattedPhone = formatPhoneNumber(phone);

    if (!formattedPhone) {
      // Status updated but no valid phone — log it
      await adminClient.from('wa_send_log').insert({
        type: 'shipping',
        order_id,
        phone: phone,
        customer_name: customerName,
        template_name: 'shipping_update',
        status: 'failed',
        error_message: 'Invalid phone number format',
        sent_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, skipped: true, reason: 'Invalid phone' });
    }

    // ─── 3. Send WhatsApp shipping notification ───────────────────
    console.log(`[WhatsApp Shipping API] Sending shipping WA for order ${order_id} to ${formattedPhone}`);

    const waResult = await sendShippingWA({
      phone: formattedPhone,
      customer_name: customerName,
      order_id,
      tracking_id: tracking_id || '',
      courier_name: courier_name || 'NINOC Delivery',
      estimated_delivery,
    });

    // ─── 4. Log WA result ────────────────────────────────────────
    await adminClient.from('wa_send_log').insert({
      type: 'shipping',
      order_id,
      phone: formattedPhone,
      customer_name: customerName,
      template_name: 'shipping_update',
      status: waResult.success ? 'sent' : 'failed',
      whatsapp_message_id: waResult.message_id || null,
      error_message: waResult.error || null,
      sent_at: waResult.success ? new Date().toISOString() : null,
    });

    // ─── 5. Update order WA tracking columns ─────────────────────
    await adminClient
      .from('orders')
      .update({
        wa_shipping_sent: true,
        wa_shipping_sent_at: new Date().toISOString(),
        wa_tracking_message_id: waResult.message_id || null,
      })
      .eq('id', order_id);

    if (waResult.success) {
      console.log(`[WhatsApp Shipping API] Shipping WA sent. Message ID: ${waResult.message_id}`);
    } else {
      console.warn(`[WhatsApp Shipping API] Shipping WA failed: ${waResult.error}`);
    }

    return NextResponse.json({
      success: true,
      wa_sent: waResult.success,
      message_id: waResult.message_id,
      error: waResult.error || null,
    });

  } catch (err) {
    console.error('[WhatsApp Shipping API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}