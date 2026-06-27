import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
import crypto from 'crypto';
import { sendShippingWA, sendDeliveredWA, formatPhoneNumber } from '@/lib/whatsapp';

// ============================================================
// BITESHIP WEBHOOK HANDLER (PRODUCTION VERSION)
// Receives real-time tracking updates from Biteship
// Events: order.status, order.price, order.waybill_id
// ============================================================

interface BiteshipWebhookPayload {
  event: string;
  // order.status event
  order_id?: string;
  status?: string;
  courier_tracking_id?: string;
  courier_waybill_id?: string;
  courier_company?: string;
  courier_driver_name?: string;
  courier_driver_phone?: string;
  courier_link?: string;
  // order.price event
  price?: number;
  // order.waybill_id event
  waybill_id?: string;
}

// Map Biteship status to our internal order status
function mapBiteshipStatus(biteshipStatus: string): string {
  const statusMap: Record<string, string> = {
    'confirmed': 'pending',
    'allocated': 'pending',
    'pick_up': 'shipped',
    'picking_up': 'shipped',
    'picked': 'shipped',
    'shipping': 'shipped',
    'delivered': 'delivered',
    'rejected': 'cancelled',
    'canceled': 'cancelled',
    'cancelled': 'cancelled',
    'returned': 'cancelled',
    'returning': 'shipped',
    'on_hold': 'shipped',
    'disposed': 'cancelled',
  };

  return statusMap[biteshipStatus] || 'pending';
}

// Verify webhook signature from Biteship
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) return true; // Skip verification if no secret configured
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  // Use simple comparison for hex strings — timingSafeEqual requires same buffer length
  // Both are 64-char hex strings, but guard against malformed signatures
  if (signature.length !== computed.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // 1. Handle empty body (ping check)
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ status: 'OK', message: 'Handshake successful' });
    }

    let payload: BiteshipWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.warn('[Biteship Webhook] Non-JSON payload received');
      return NextResponse.json({ status: 'OK', message: 'Payload accepted' });
    }

    // 2. Verify signature if secret is set in Vercel
    const webhookSecret = process.env.BITESHIP_WEBHOOK_SECRET || '';
    const signature = req.headers.get('x-biteship-signature') || '';

    if (webhookSecret) {
      // If secret is configured, signature MUST be present and valid
      if (!signature) {
        console.error('[Biteship Webhook] Signature header missing but secret is configured');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const isValid = verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[Biteship Webhook] Signature verification failed');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log(`[Biteship Webhook] Event: ${payload.event}, Order: ${payload.order_id}`);

    // 3. Process Events
    switch (payload.event) {
      case 'order.status': {
        if (!payload.order_id || !payload.status) break;

        const internalStatus = mapBiteshipStatus(payload.status);

        // Update main order table
        const { data: updatedOrder } = await supabase
          .from('orders')
          .update({
            status: internalStatus,
            courier: payload.courier_company || undefined,
            tracking_id: payload.courier_tracking_id || payload.courier_waybill_id || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.order_id)
          .select('id, shipping_address, customer_name, wa_shipping_sent, wa_delivered_sent')
          .single();

        if (updatedOrder) {
          const phoneRaw = (updatedOrder.shipping_address as any)?.phone || '';
          const phone = formatPhoneNumber(phoneRaw);
          const customerName = updatedOrder.customer_name || (updatedOrder.shipping_address as any)?.name || 'Pelanggan';
          
          if (phone) {
            // Send Shipping Notification (only if not sent before)
            if (internalStatus === 'shipped' && !updatedOrder.wa_shipping_sent) {
              const trackingId = payload.courier_tracking_id || payload.courier_waybill_id || 'Otomatis';
              const courier = payload.courier_company || 'Kurir Ekspedisi';
              
              const waRes = await sendShippingWA({
                phone,
                customer_name: customerName,
                order_id: updatedOrder.id,
                tracking_id: trackingId,
                courier_name: courier,
              });

              if (waRes.success) {
                await adminClient.from('orders').update({ wa_shipping_sent: true, wa_shipping_sent_at: new Date().toISOString() }).eq('id', updatedOrder.id);
              }
            }
            
            // Send Delivered Notification (only if not sent before)
            if (internalStatus === 'delivered' && !updatedOrder.wa_delivered_sent) {
              const waRes = await sendDeliveredWA({
                phone,
                customer_name: customerName,
                order_id: updatedOrder.id,
              });

              if (waRes.success) {
                await adminClient.from('orders').update({ wa_delivered_sent: true, wa_delivered_sent_at: new Date().toISOString() }).eq('id', updatedOrder.id);
              }
            }
          }
        }

        // Log to tracking_logs for history
        await adminClient.from('tracking_logs').insert({
          order_id: payload.order_id,
          biteship_status: payload.status,
          internal_status: internalStatus,
          courier_company: payload.courier_company || null,
          courier_driver_name: payload.courier_driver_name || null,
          courier_driver_phone: payload.courier_driver_phone || null,
          courier_link: payload.courier_link || null,
          raw_payload: JSON.stringify(payload),
        });
        break;
      }

      case 'order.waybill_id': {
        const waybillId = payload.waybill_id || payload.courier_waybill_id;
        if (payload.order_id && waybillId) {
          await supabase
            .from('orders')
            .update({ tracking_id: waybillId })
            .eq('id', payload.order_id);
        }
        break;
      }

      case 'order.price': {
        if (payload.order_id) {
          await adminClient.from('tracking_logs').insert({
            order_id: payload.order_id,
            biteship_status: 'price_update',
            internal_status: 'info',
            raw_payload: JSON.stringify(payload),
          });
        }
        break;
      }
    }

    return NextResponse.json({ status: 'OK', event: payload.event });

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Webhook] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'NINOC Logistics Engine',
    timestamp: new Date().toISOString(),
  });
}

