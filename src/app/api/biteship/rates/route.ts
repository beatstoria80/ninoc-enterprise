/**
 * Biteship Shipping Rates API
 * Proxy to Biteship API — converts our internal format to Biteship format
 */
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { destination_area_id, origin_area_id, items, couriers } = await req.json();

    const apiKey = process.env.BITESHIP_API_KEY;

    // Fallback to mock data if no API key configured
    if (!apiKey || apiKey === 'your_biteship_api_key_here') {
      console.warn('[Biteship Rates] No API key configured — returning mock rates');
      return NextResponse.json({
        success: true,
        object: 'rates',
        pricing: [
          {
            id: 'rate_jne_reg',
            company: 'jne',
            courier_name: 'JNE',
            courier_service_name: 'REGULER',
            courier_service_code: 'reg',
            description: 'Layanan reguler JNE - 2-3 hari kerja',
            duration: '2-3 Days',
            price: 15000,
          },
          {
            id: 'rate_jne_yes',
            company: 'jne',
            courier_name: 'JNE',
            courier_service_name: 'YES',
            courier_service_code: 'yes',
            description: 'Layanan besok JNE - 1 hari kerja',
            duration: '1 Day',
            price: 25000,
          },
          {
            id: 'rate_jnt_ez',
            company: 'jnt',
            courier_name: 'J&T Express',
            courier_service_name: 'EZ',
            courier_service_code: 'ez',
            description: 'Layanan ekspres J&T - 1-2 hari kerja',
            duration: '1-2 Days',
            price: 12000,
          },
          {
            id: 'rate_sicepat_best',
            company: 'sicepat',
            courier_name: 'SiCepat',
            courier_service_name: 'BEST',
            courier_service_code: 'best',
            description: 'Layanan prioritas SiCepat - 1 hari kerja',
            duration: '1 Day',
            price: 18000,
          },
          {
            id: 'rate_anteraja_reg',
            company: 'anteraja',
            courier_name: 'AnterAja',
            courier_service_name: 'REGULER',
            courier_service_code: 'reg',
            description: 'Layanan reguler AnterAja',
            duration: '2-3 Days',
            price: 13500,
          },
          {
            id: 'rate_ninja_dlv',
            company: 'ninja',
            courier_name: 'Ninja Van',
            courier_service_name: 'DELIVERY',
            courier_service_code: 'dlv',
            description: 'Layanan Ninja Van - same day/next day',
            duration: 'Same Day',
            price: 22000,
          },
        ],
        available_couriers: ['jne', 'jnt', 'sicepat', 'anteraja', 'ninja'],
      });
    }

    // Real Biteship API call
    const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination_area_id,
        origin_area_id: origin_area_id || 'JAWA BARAT',
        items: items || [],
        couriers: couriers || 'jne,jnt,sicepat,anteraja,ninja',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Biteship Rates] API error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch rates' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Rates] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}