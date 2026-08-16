/**
 * Biteship Order Creation API
 * Creates a shipment/waybill in Biteship and saves tracking_id to Supabase.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { sendEmailShipping } from '@/lib/email';
import { sendShippingWA, formatPhoneNumber } from '@/lib/whatsapp';
import { notifyAllChannels } from '@/lib/notifications';



const OrderPayloadSchema = z.object({
  order_id: z.string().min(1),
  courier_company: z.string().min(1),
  courier_type: z.string().min(1),
  destination: z.any().optional(),
  items: z.array(z.any()).optional(),
  metadata: z.any().optional()
});

async function getOriginDetails(): Promise<any> {
  let defaultOrigin = {
    contact_name: "NINOC Logistics",
    contact_phone: "+628211983774",
    address: "Kompleks Griya Saluyu, Blok AA No.87",
    postal_code: 40292,
    note: "Gudang Utama NINOC (Bandung)",
    latitude: -6.953531,
    longitude: 107.665518
  };
  
  try {
    const { data: hubData } = await adminClient
      .from('warehouses')
      .select('name, address, postal_code, latitude, longitude, phone')
      .eq('is_crossdock_hub', true)
      .limit(1)
      .single();
      
    if (hubData) {
      defaultOrigin = {
        contact_name: "NINOC Logistics",
        contact_phone: hubData.phone || defaultOrigin.contact_phone,
        address: hubData.address || defaultOrigin.address,
        postal_code: parseInt(hubData.postal_code || '40292', 10),
        note: `Gudang Utama ${hubData.name || 'NINOC'}`,
        latitude: hubData.latitude || defaultOrigin.latitude,
        longitude: hubData.longitude || defaultOrigin.longitude
      };
    }
  } catch (e) {
    console.warn('[Biteship Orders] Failed to fetch Ninoc Hub from DB, using fallback.', e);
  }
  return defaultOrigin;
}


async function saveOrderToSupabase(
  orderId: string,
  trackingId: string,
  courierCompany: string,
  courierType: string,
  rawPayload?: object
) {
  // Get current print count
  const { data: orderData } = await adminClient
    .from('orders')
    .select('print_count, status')
    .eq('id', orderId)
    .single();

  const currentCount = orderData?.print_count || 0;

  // Update order with tracking info and increment print count
  // Only transition to 'shipped' if status is 'paid' or 'processing' — do not regress other statuses
  const currentStatus = orderData?.status || 'paid';
  const nextStatus = ['paid', 'processing'].includes(currentStatus) ? 'shipped' : currentStatus;

  const { error: updateError } = await adminClient
    .from('orders')
    .update({
      tracking_id: trackingId,
      courier: `${courierCompany} ${courierType}`.toUpperCase(),
      status: nextStatus,
      print_count: currentCount + 1,
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('[Biteship Create Order] Failed to update order:', updateError);
  }

  // Log to tracking_logs
  await adminClient.from('tracking_logs').insert({
    order_id: orderId,
    biteship_status: 'allocated',
    internal_status: 'paid',
    courier_company: courierCompany,
    courier_link: null,
    courier_driver_name: null,
    courier_driver_phone: null,
    raw_payload: JSON.stringify(rawPayload || {}),
  });

  // ─── Trigger Immediate Shipping Notifications (Email, WA, Push) ───
  try {
    const { data: fullOrder } = await adminClient
      .from('orders')
      .select('id, user_id, order_number, shipping_address, customer_name, wa_shipping_sent')
      .eq('id', orderId)
      .single();

    if (fullOrder) {
      const courierFormatted = `${courierCompany} ${courierType}`.toUpperCase();
      const customerName = fullOrder.customer_name || (fullOrder.shipping_address as any)?.name || 'Pelanggan';
      const phoneRaw = (fullOrder.shipping_address as any)?.phone || '';
      const phone = formatPhoneNumber(phoneRaw);
      const customerEmail = (fullOrder.shipping_address as any)?.email;

      // 1. WhatsApp Notification
      if (phone && !fullOrder.wa_shipping_sent) {
        // ATOMIC FIX: Set flag before slow network I/O
        await adminClient.from('orders').update({
          wa_shipping_sent: true,
          wa_shipping_sent_at: new Date().toISOString(),
        }).eq('id', fullOrder.id);

        sendShippingWA({
          phone,
          customer_name: customerName,
          order_id: fullOrder.id,
          tracking_id: trackingId,
          courier_name: courierFormatted,
        }).then(async (waResult) => {
          await adminClient.from('wa_send_log').insert({
            type: 'shipping',
            order_id: fullOrder.id,
            phone,
            customer_name: customerName,
            template_name: 'shipping_update',
            status: waResult.success ? 'sent' : 'failed',
            whatsapp_message_id: waResult.message_id || null,
            error_message: waResult.error || null,
            sent_at: waResult.success ? new Date().toISOString() : null,
          });

          if (waResult.success && waResult.message_id) {
            await adminClient.from('orders').update({
              wa_tracking_message_id: waResult.message_id,
            }).eq('id', fullOrder.id);
          }
        }).catch(err => console.error('[Biteship Create Order] Async WA Error:', err));
      }

      // 2. Email Shipping Notification
      if (customerEmail) {
        console.log(`[Biteship Create Order] Sending shipping email to ${customerEmail} for order ${fullOrder.id}`);
        sendEmailShipping(fullOrder, customerEmail, trackingId, courierFormatted)
          .catch(err => console.error('[Biteship Create Order] Async Email Error:', err));
      }

      // 3. Push & In-App Notification
      if (fullOrder.user_id) {
        notifyAllChannels({
          userId: fullOrder.user_id,
          title: 'Pesanan Dalam Pengiriman',
          message: `Pesanan #${fullOrder.order_number || fullOrder.id} sedang dalam perjalanan via ${courierFormatted}. Resi: ${trackingId}`,
          actionLink: `/profile/orders/${fullOrder.id}`,
        }).catch(err => console.error('[Biteship Create Order] Async Push Error:', err));
      }
    }
  } catch (notifErr) {
    console.error('[Biteship Create Order] Error sending immediate shipping notifications:', notifErr);
  }
}

export async function POST(req: Request) {
  try {
    // 1. AUTHENTICATION CHECK
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');

    if (!adminSession || adminSession.value !== 'authenticated') {
      const supabaseServer = await createClient();
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized access. Authentication required.' }, { status: 401 });
      }

      // 2. AUTHORIZATION CHECK (RBAC)
      const { data: roleData } = await supabaseServer
        .from('admin_roles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!roleData || !['super_admin', 'outbound_logistics'].includes(roleData.role)) {
        return NextResponse.json({ error: 'Forbidden. Insufficient privileges.' }, { status: 403 });
      }
    }

    // 3. PAYLOAD SANITIZATION (Zod)
    const json = await req.json();
    const parseResult = OrderPayloadSchema.safeParse(json);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload schema', details: parseResult.error.format() }, { status: 400 });
    }

    const {
      order_id,
      courier_company,
      courier_type: rawCourierType,
      destination,
      items,
      metadata
    } = parseResult.data;

    const apiKey = process.env.BITESHIP_API_KEY;
    const courierType = rawCourierType.toLowerCase();

    // Check if already shipped to prevent double dispatch
    const { data: existingOrder } = await adminClient
      .from('orders')
      .select('status, tracking_id, print_count, courier')
      .eq('id', order_id)
      .single();

    if (existingOrder?.tracking_id) {
      const newCount = (existingOrder.print_count || 0) + 1;
      await adminClient.from('orders').update({ print_count: newCount }).eq('id', order_id);
      
      console.log(`[Biteship Create Order] Order ${order_id} already has a tracking ID. Reprinting.`);
      return NextResponse.json({
        success: true,
        source: 'reprint',
        waybill_id: existingOrder.tracking_id,
        tracking_id: existingOrder.tracking_id,
        courier_company: existingOrder.courier?.split(' ')[0] || courier_company,
        status: existingOrder.status || 'shipped',
        message: 'Order already has a tracking ID. Incrementing print count.'
      });
    }

    // Try real Biteship API if key is configured
    if (apiKey && apiKey !== 'your_biteship_api_key_here') {
      try {
        const originDetails = await getOriginDetails();

        const response = await fetch('https://api.biteship.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            external_id: order_id,
            courier_company: courier_company.toLowerCase(),
            courier_type: courierType,
            destination,
            origin: originDetails,
            items,
            metadata: metadata || {},
          }),
        });

        const data = await response.json();

        if (response.ok && data.success !== false) {
          // Success — save to Supabase
          // IMPORTANT: Biteship returns both waybill_id (nomor resi) and tracking_id (internal tracking ID)
          // We store tracking_id (for tracking API) but expose waybill_id (for customer/label display)
          const biteshipTrackingId = data.tracking_id || data.waybill_id;
          await saveOrderToSupabase(order_id, biteshipTrackingId, data.courier_company, data.courier_type, data);

          return NextResponse.json({
            success: true,
            source: 'biteship',
            waybill_id: data.waybill_id,
            tracking_id: biteshipTrackingId,
            courier_company: data.courier_company,
            courier_type: data.courier_type,
            status: data.status,
            estimated_pickup: data.estimated_pickup,
            estimated_delivery: data.estimated_delivery,
            created_at: data.created_at,
          });
        }

        // API error (not activated / no balance)
        console.warn(`[Biteship Create Order] API error: ${JSON.stringify(data)}`);
        return NextResponse.json({ error: 'Layanan pengiriman sedang tidak tersedia. Hubungi support untuk bantuan.' }, { status: 503 });

      } catch (apiErr) {
        console.error('[Biteship Create Order] API call failed:', (apiErr as Error).message);
        return NextResponse.json({ error: 'Gagal menghubungi layanan pengiriman. Silakan coba lagi.' }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Layanan pengiriman belum dikonfigurasi. Hubungi admin.' }, { status: 500 });

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Create Order] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET: List Biteship orders
 */
export async function GET(req: Request) {
  const apiKey = process.env.BITESHIP_API_KEY;

  if (!apiKey || apiKey === 'your_biteship_api_key_here') {
    return NextResponse.json({ success: false, error: 'Biteship API key not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const externalId = searchParams.get('external_id');

    const url = externalId
      ? `https://api.biteship.com/v1/orders?external_id=${externalId}`
      : 'https://api.biteship.com/v1/orders';

    const response = await fetch(url, {
      headers: { 'Authorization': apiKey },
    });

    const data = await response.json();
    return NextResponse.json({ ...data, source: 'biteship' });

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship List Orders] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}