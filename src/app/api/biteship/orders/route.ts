/**
 * Biteship Order Creation API
 * Creates a shipment/waybill in Biteship and saves tracking_id to Supabase
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    if (!apiKey || apiKey === 'your_biteship_api_key_here') {
      // Mock response — generate mock tracking ID
      const mockWaybill = `MOCK-${courier_company.toUpperCase()}-${Date.now()}`;
      const now = new Date().toISOString();

      // Save to Supabase
      await supabase
        .from('orders')
        .update({
          tracking_id: mockWaybill,
          courier: `${courier_company} ${courier_type}`,
          status: 'paid',
        })
        .eq('id', order_id);

      // Log to tracking_logs
      await supabase.from('tracking_logs').insert({
        order_id,
        biteship_status: 'allocated',
        internal_status: 'paid',
        courier_company,
        raw_payload: JSON.stringify({ mock: true, waybill: mockWaybill }),
        courier_link: null,
        courier_driver_name: null,
        courier_driver_phone: null,
      });

      return NextResponse.json({
        success: true,
        waybill_id: mockWaybill,
        tracking_id: mockWaybill,
        courier_company,
        courier_type,
        status: 'allocated',
        note: 'Mock mode — Biteship API not configured'
      });
    }

    // Real Biteship API call
    const response = await fetch('https://api.biteship.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: order_id,
        courier_company,
        courier_type,
        destination,
        origin,
        items,
        metadata: metadata || {},
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Biteship Create Order] API error:', data);
      return NextResponse.json({ error: data.message || 'Failed to create shipment' }, { status: 502 });
    }

    // Save tracking_id and courier info to Supabase
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        tracking_id: data.waybill_id || data.tracking_id,
        courier: `${data.courier_company} ${data.courier_type}`.toUpperCase(),
        status: 'paid',
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('[Biteship Create Order] Failed to update order:', updateError);
    }

    // Log to tracking_logs
    await supabase.from('tracking_logs').insert({
      order_id,
      biteship_status: data.status || 'allocated',
      internal_status: 'paid',
      courier_company: data.courier_company,
      courier_driver_name: data.courier_driver_name || null,
      courier_driver_phone: data.courier_driver_phone || null,
      courier_link: data.courier_link || null,
      raw_payload: JSON.stringify(data),
    });

    return NextResponse.json({
      success: true,
      waybill_id: data.waybill_id,
      tracking_id: data.tracking_id,
      courier_company: data.courier_company,
      courier_type: data.courier_type,
      status: data.status,
      estimated_pickup: data.estimated_pickup,
      estimated_delivery: data.estimated_delivery,
      created_at: data.created_at,
    });

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Create Order] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET: List Biteship orders (optional admin view)
 */
export async function GET(req: Request) {
  const apiKey = process.env.BITESHIP_API_KEY;

  if (!apiKey || apiKey === 'your_biteship_api_key_here') {
    return NextResponse.json({ success: true, orders: [], note: 'Biteship API not configured' });
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
    return NextResponse.json(data);

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship List Orders] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}