import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendShippingWA, sendDeliveredWA, formatPhoneNumber } from '@/lib/whatsapp';
import { sendEmailShipping, sendEmailDelivered } from '@/lib/email';
import { notifyAllChannels } from '@/lib/notifications';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { WebhookLogRepository } from '@/repositories/WebhookLogRepository';
import { withErrorHandler, apiSuccess, apiError } from '@/lib/apiResponse';

// ============================================================
// BITESHIP WEBHOOK HANDLER (PRODUCTION VERSION)
// Receives real-time tracking updates from Biteship
// Events: order.status, order.price, order.waybill_id
// ============================================================

interface BiteshipWebhookPayload {
  event: string;
  order_id?: string;
  status?: string;
  courier_tracking_id?: string;
  courier_waybill_id?: string;
  courier_company?: string;
  courier_driver_name?: string;
  courier_driver_phone?: string;
  courier_link?: string;
  price?: number;
  waybill_id?: string;
}

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

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  if (signature.length !== computed.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export const POST = withErrorHandler(async (req: Request) => {
    const rawBody = await req.text();

    if (!rawBody || rawBody.trim() === '') {
      return apiSuccess({ message: 'Handshake successful' });
    }

    let payload: BiteshipWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.warn('[Biteship Webhook] Non-JSON payload received');
      return apiSuccess({ message: 'Payload accepted' });
    }

    const webhookSecret = process.env.BITESHIP_WEBHOOK_SECRET || '';
    const signature = req.headers.get('x-biteship-signature') || '';

    // STRICT FAIL-CLOSED: Tolak proses webhook jika rahasia tidak dikonfigurasi di environment
    if (!webhookSecret) {
      console.error('[Biteship Webhook] CRITICAL: Webhook secret is not configured!');
      return apiError('Server configuration error', 500);
    }

    if (!signature) {
      return apiError('Unauthorized', 401);
    }

    const isValid = verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return apiError('Unauthorized', 401);
    }

    console.log(`[Biteship Webhook] Event: ${payload.event}, Order: ${payload.order_id}`);
    const supabaseAdmin = getSupabaseAdmin();
    const webhookLogRepo = new WebhookLogRepository(supabaseAdmin);

    switch (payload.event) {
      case 'order.status': {
        if (!payload.order_id || !payload.status) break;

        const internalStatus = mapBiteshipStatus(payload.status);

        const { data: updatedOrder } = await supabaseAdmin
          .from('orders')
          .update({
            status: internalStatus,
            courier: payload.courier_company || undefined,
            tracking_id: payload.courier_tracking_id || payload.courier_waybill_id || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.order_id)
          .select('id, user_id, order_number, shipping_address, customer_name, customer_email, wa_shipping_sent, wa_delivered_sent')
          .single();

        if (updatedOrder) {
          const phoneRaw = (updatedOrder.shipping_address as any)?.phone || '';
          const phone = formatPhoneNumber(phoneRaw);
          const customerName = updatedOrder.customer_name || (updatedOrder.shipping_address as any)?.name || 'Pelanggan';
          
          // ATOMIC FIX: Prevent TOCTOU spam by updating notification flag BEFORE executing slow network I/O
          if (internalStatus === 'shipped' && !updatedOrder.wa_shipping_sent) {
            await supabaseAdmin
              .from('orders')
              .update({ wa_shipping_sent: true, wa_shipping_sent_at: new Date().toISOString() })
              .eq('id', updatedOrder.id);

            const trackingId = payload.courier_tracking_id || payload.courier_waybill_id || 'Otomatis';
            const courier = payload.courier_company || 'Kurir Ekspedisi';
            
            if (phone) {
              sendShippingWA({
                phone,
                customer_name: customerName,
                order_id: updatedOrder.id,
                tracking_id: trackingId,
                courier_name: courier,
              }).catch(err => console.error('[Biteship Webhook] Async WA Shipping Error:', err));
            }

            if (updatedOrder.customer_email) {
              sendEmailShipping(updatedOrder, updatedOrder.customer_email, trackingId, courier)
                .catch(err => console.error('[Biteship Webhook] Async Email Shipping Error:', err));
            }
          }
          
          if (internalStatus === 'delivered' && !updatedOrder.wa_delivered_sent) {
            await supabaseAdmin
              .from('orders')
              .update({ wa_delivered_sent: true, wa_delivered_sent_at: new Date().toISOString() })
              .eq('id', updatedOrder.id);

            if (phone) {
              sendDeliveredWA({
                phone,
                customer_name: customerName,
                order_id: updatedOrder.id,
              }).catch(err => console.error('[Biteship Webhook] Async WA Delivered Error:', err));
            }

            if (updatedOrder.customer_email) {
              sendEmailDelivered(updatedOrder, updatedOrder.customer_email)
                .catch(err => console.error('[Biteship Webhook] Async Email Delivered Error:', err));
            }
          }

          if (updatedOrder.user_id) {
            if (internalStatus === 'shipped') {
              const trackingId = payload.courier_tracking_id || payload.courier_waybill_id || '';
              notifyAllChannels({
                userId: updatedOrder.user_id,
                title: 'Pesanan Dalam Pengiriman',
                message: `Pesanan #${updatedOrder.order_number || updatedOrder.id} sedang dalam perjalanan.${trackingId ? ` Resi: ${trackingId}` : ''}`,
                actionLink: `/profile/orders/${updatedOrder.id}`,
              }).catch(err => console.error('[Biteship Webhook] Async Push Shipped Error:', err));
            } else if (internalStatus === 'delivered') {
              notifyAllChannels({
                userId: updatedOrder.user_id,
                title: 'Pesanan Telah Diterima',
                message: `Pesanan #${updatedOrder.order_number || updatedOrder.id} telah sampai. Terima kasih telah berbelanja di NINOC!`,
                actionLink: `/profile/orders/${updatedOrder.id}`,
              }).catch(err => console.error('[Biteship Webhook] Async Push Delivered Error:', err));
            }
          }
        }

        await webhookLogRepo.logBiteshipEvent({
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
          await supabaseAdmin
            .from('orders')
            .update({ tracking_id: waybillId })
            .eq('id', payload.order_id);
        }
        break;
      }

      case 'order.price': {
        if (payload.order_id) {
          await webhookLogRepo.logBiteshipEvent({
            order_id: payload.order_id,
            biteship_status: 'price_update',
            internal_status: 'info',
            raw_payload: JSON.stringify(payload),
          });
        }
        break;
      }
    }

    return apiSuccess({ event: payload.event });
});

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'NINOC Logistics Engine',
    timestamp: new Date().toISOString(),
  });
}
