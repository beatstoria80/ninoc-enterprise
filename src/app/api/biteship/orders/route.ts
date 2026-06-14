/**
 * Biteship Order Creation API
 * Creates a shipment/waybill in Biteship and saves tracking_id to Supabase
 * Falls back to mock tracking ID if API not activated
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Generate mock tracking ID for development/pre-activation
function generateMockWaybill(courierCompany: string): string {
  const prefix = courierCompany.toUpperCase().slice(0, 3);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `NNC-${prefix}${random}${timestamp}`;
}

async function saveOrderToSupabase(
  orderId: string,
  trackingId: string,
  courierCompany: string,
  courierType: string,
  mock: boolean = false,
  rawPayload?: object
) {
  // Get current print count
  const { data: orderData } = await supabase
    .from('orders')
    .select('print_count, status')
    .eq('id', orderId)
    .single();

  const currentCount = orderData?.print_count || 0;

  // Update order with tracking info and increment print count
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      tracking_id: trackingId,
      courier: `${courierCompany} ${courierType}`.toUpperCase(),
      status: orderData?.status === 'paid' ? 'shipped' : orderData?.status || 'shipped',
      print_count: currentCount + 1,
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('[Biteship Create Order] Failed to update order:', updateError);
  }

  // Log to tracking_logs
  await supabase.from('tracking_logs').insert({
    order_id: orderId,
    biteship_status: mock ? 'mock_allocated' : 'allocated',
    internal_status: 'paid',
    courier_company: courierCompany,
    courier_link: null,
    courier_driver_name: null,
    courier_driver_phone: null,
    raw_payload: JSON.stringify(rawPayload || { mock }),
  });
}

export async function POST(req: Request) {
  try {
    const {
      order_id,
      courier_company,
      courier_type,
      destination,
      origin,
      items,
      metadata
    } = await req.json();

    if (!order_id || !courier_company || !courier_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    const courierType = courier_type.toLowerCase();

    // Try real Biteship API if key is configured
    if (apiKey && apiKey !== 'your_biteship_api_key_here') {
      try {
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
            origin,
            items,
            metadata: metadata || {},
          }),
        });

        const data = await response.json();

        if (response.ok && data.success !== false) {
          // Success — save to Supabase
          await saveOrderToSupabase(order_id, data.waybill_id, data.courier_company, data.courier_type, false, data);

          return NextResponse.json({
            success: true,
            source: 'biteship',
            waybill_id: data.waybill_id,
            tracking_id: data.waybill_id,
            courier_company: data.courier_company,
            courier_type: data.courier_type,
            status: data.status,
            estimated_pickup: data.estimated_pickup,
            estimated_delivery: data.estimated_delivery,
            created_at: data.created_at,
          });
        }

        // API error (not activated / no balance) — fall back to mock
        console.warn(`[Biteship Create Order] API error, using mock: ${JSON.stringify(data)}`);

      } catch (apiErr) {
        console.warn('[Biteship Create Order] API call failed, using mock:', (apiErr as Error).message);
      }
    }

    // ── FALLBACK: Generate mock waybill ──
    const mockWaybill = generateMockWaybill(courier_company);
    await saveOrderToSupabase(order_id, mockWaybill, courier_company, courier_type, true);

    console.log(`[Biteship Create Order] Mock mode — generated: ${mockWaybill}`);

    return NextResponse.json({
      success: true,
      source: 'mock',
      waybill_id: mockWaybill,
      tracking_id: mockWaybill,
      courier_company: courier_company.toLowerCase(),
      courier_type: courierType,
      status: 'allocated',
      note: 'Mock mode — Biteship Order API not yet activated. Order will be processed when API is activated.',
    });

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
    return NextResponse.json({ success: true, orders: [], source: 'mock' });
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