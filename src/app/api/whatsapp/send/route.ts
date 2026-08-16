/**
 * WhatsApp Send API
 * POST /api/whatsapp/send
 *
 * Server-side endpoint for sending transactional WhatsApp messages.
 * Called from:
 * - Payment webhook (invoice notification)
 * - Admin page (shipping update, delivered notification)
 * - Biteship webhook (shipping notification)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';
import {
  sendInvoiceWA,
  sendShippingWA,
  sendDeliveredWA,
  sendBroadcastWA,
  sendTemplateMessage,
  formatPhoneNumber,
  WA_TEMPLATES,
} from '@/lib/whatsapp';



// ─── POST: Send a message ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, phone, customer_name, order_id, tracking_id, courier_name, estimated_delivery, total_price, payment_url, template, components, promo_text } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone || '');
    if (!formattedPhone) {
      return NextResponse.json({ error: 'Invalid or missing phone number' }, { status: 400 });
    }

    let result;
    let logType: 'invoice' | 'shipping' | 'delivered' | 'custom' = 'custom';

    switch (type) {
      case 'invoice': {
        result = await sendInvoiceWA({
          phone: formattedPhone,
          customer_name: customer_name || 'Pelanggan',
          order_id: order_id || '',
          total_price: total_price || 'Rp 0',
          payment_url,
        });
        logType = 'invoice';
        break;
      }

      case 'shipping': {
        result = await sendShippingWA({
          phone: formattedPhone,
          customer_name: customer_name || 'Pelanggan',
          order_id: order_id || '',
          tracking_id: tracking_id || '',
          courier_name: courier_name || 'Kurir',
          estimated_delivery,
        });
        logType = 'shipping';
        break;
      }

      case 'delivered': {
        result = await sendDeliveredWA({
          phone: formattedPhone,
          customer_name: customer_name || 'Pelanggan',
          order_id: order_id || '',
        });
        logType = 'delivered';
        break;
      }

      case 'broadcast': {
        result = await sendBroadcastWA({
          phone: formattedPhone,
          customer_name: customer_name || 'Pelanggan',
          promo_text: promo_text || '',
        });
        logType = 'custom';
        break;
      }

      case 'custom': {
        if (!template || !components) {
          return NextResponse.json({ error: 'Custom type requires template name and components' }, { status: 400 });
        }
        result = await sendTemplateMessage(template, formattedPhone, components);
        logType = 'custom';
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    // Log to audit trail
    await adminClient.from('wa_send_log').insert({
      type: logType,
      order_id: order_id || null,
      phone: formattedPhone,
      customer_name: customer_name || null,
      template_name: WA_TEMPLATES[logType.toUpperCase() as keyof typeof WA_TEMPLATES] || template || null,
      message_content: null,
      status: result.success ? 'sent' : 'failed',
      whatsapp_message_id: result.message_id || null,
      error_message: result.error || null,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    // Update order WA tracking columns if applicable
    if (result.success && order_id) {
      const update: Record<string, unknown> = {};
      if (type === 'invoice') {
        update.wa_invoice_sent = true;
        update.wa_invoice_sent_at = new Date().toISOString();
      } else if (type === 'shipping') {
        update.wa_shipping_sent = true;
        update.wa_shipping_sent_at = new Date().toISOString();
        update.wa_tracking_message_id = result.message_id;
      }
      if (Object.keys(update).length > 0) {
        await adminClient.from('orders').update(update).eq('id', order_id);
      }
    }

    if (result.success) {
      return NextResponse.json({ success: true, message_id: result.message_id });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

  } catch (err) {
    console.error('[WhatsApp Send API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── GET: Status ────────────────────────────────────────────────────────────

export async function GET() {
  const configured = !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: sentToday } = await adminClient
    .from('wa_send_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('created_at', today.toISOString());

  const { count: failedToday } = await adminClient
    .from('wa_send_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', today.toISOString());

  return NextResponse.json({
    configured,
    phone_number_id: configured ? '***' + (process.env.WHATSAPP_PHONE_NUMBER_ID?.slice(-6) || '') : null,
    today: { sent: sentToday || 0, failed: failedToday || 0 },
  });
}
