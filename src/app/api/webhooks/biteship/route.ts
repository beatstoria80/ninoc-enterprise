import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// ============================================================
// BITESHIP WEBHOOK HANDLER
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
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // 1. Handle empty body (common during installation/verification)
    if (!rawBody || rawBody.trim() === '') {
      console.log('[Biteship Webhook] Received empty body (Installation Ping)');
      return NextResponse.json({ status: 'OK', message: 'Endpoint ready' });
    }

    let payload: BiteshipWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.log('[Biteship Webhook] Received non-JSON body');
      return NextResponse.json({ status: 'OK', message: 'Received non-JSON body' });
    }

    // 2. Verify signature if configured
    const webhookSecret = process.env.BITESHIP_WEBHOOK_SECRET || '';
    const signature = req.headers.get('x-biteship-signature') || '';

    if (webhookSecret && signature) {
      const isValid = verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Biteship webhook signature verification failed');
        // During installation, we might return 200 even if signature fails if secret is wrong
        // but for now let's keep it strict if secret IS provided
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    console.log(`[Biteship Webhook] Event: ${payload.event}, Order: ${payload.order_id}, Status: ${payload.status}`);

    // 2. Handle different event types
    switch (payload.event) {

      // ── ORDER STATUS UPDATE ──
      case 'order.status': {
        if (!payload.order_id || !payload.status) {
          return NextResponse.json({ error: 'Missing order_id or status' }, { status: 400 });
        }

        const internalStatus = mapBiteshipStatus(payload.status);

        // Update order in database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: internalStatus,
            courier: payload.courier_company || undefined,
            tracking_id: payload.courier_tracking_id || payload.courier_waybill_id || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.order_id);

        if (updateError) {
          console.error('[Biteship Webhook] DB update error:', updateError);
          return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        // Log tracking history
        await supabase.from('tracking_logs').insert({
          order_id: payload.order_id,
          biteship_status: payload.status,
          internal_status: internalStatus,
          courier_company: payload.courier_company || null,
          courier_driver_name: payload.courier_driver_name || null,
          courier_driver_phone: payload.courier_driver_phone || null,
          courier_link: payload.courier_link || null,
          raw_payload: payload,
        }).then(({ error }) => {
          if (error) console.warn('[Biteship Webhook] Tracking log insert warning:', error.message);
        });

        console.log(`[Biteship Webhook] Order ${payload.order_id} → ${payload.status} (internal: ${internalStatus})`);
        break;
      }

      // ── WAYBILL ID UPDATE ──
      case 'order.waybill_id': {
        if (!payload.order_id) break;

        const waybillId = payload.waybill_id || payload.courier_waybill_id;

        if (waybillId) {
          const { error } = await supabase
            .from('orders')
            .update({
              tracking_id: waybillId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payload.order_id);

          if (error) {
            console.error('[Biteship Webhook] Waybill update error:', error);
          } else {
            console.log(`[Biteship Webhook] Order ${payload.order_id} waybill: ${waybillId}`);
          }
        }
        break;
      }

      // ── PRICE UPDATE ──
      case 'order.price': {
        if (!payload.order_id) break;

        console.log(`[Biteship Webhook] Price update for ${payload.order_id}: Rp ${payload.price}`);
        // Price updates are logged but not auto-applied to order total
        // Admin should review and adjust manually if needed

        await supabase.from('tracking_logs').insert({
          order_id: payload.order_id,
          biteship_status: 'price_update',
          internal_status: 'price_update',
          raw_payload: payload,
        }).then(({ error }) => {
          if (error) console.warn('[Biteship Webhook] Price log warning:', error.message);
        });
        break;
      }

      default:
        console.log(`[Biteship Webhook] Unknown event: ${payload.event}`);
    }

    // 3. Always respond 200 to acknowledge receipt
    return NextResponse.json({ status: 'OK', received: payload.event });

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Webhook] Fatal error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Health check — Biteship may ping GET to verify endpoint
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'NINOC Biteship Webhook',
    timestamp: new Date().toISOString(),
  });
}
