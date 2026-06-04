/**
 * Biteship Shipping Rates API
 * Proxy to Biteship API — tries real Biteship first, falls back to mock on failure
 */
import { NextResponse } from 'next/server';

const MOCK_RATES = {
  success: true,
  object: 'rates',
  source: 'fallback',
  pricing: [
    { id: 'rate_jne_reg', company: 'jne', courier_name: 'JNE', courier_service_name: 'REGULER', courier_service_code: 'reg', description: 'Layanan reguler JNE - 2-3 hari kerja', duration: '2-3 Days', price: 15000 },
    { id: 'rate_jne_yes', company: 'jne', courier_name: 'JNE', courier_service_name: 'YES', courier_service_code: 'yes', description: 'Layanan besok JNE - 1 hari kerja', duration: '1 Day', price: 25000 },
    { id: 'rate_jnt_ez', company: 'jnt', courier_name: 'J&T Express', courier_service_name: 'EZ', courier_service_code: 'ez', description: 'Layanan ekspres J&T - 1-2 hari kerja', duration: '1-2 Days', price: 12000 },
    { id: 'rate_sicepat_best', company: 'sicepat', courier_name: 'SiCepat', courier_service_name: 'BEST', courier_service_code: 'best', description: 'Layanan prioritas SiCepat - 1 hari kerja', duration: '1 Day', price: 18000 },
    { id: 'rate_sicepat_reg', company: 'sicepat', courier_name: 'SiCepat', courier_service_name: 'SIUNT', courier_service_code: 'siunt', description: 'Layanan SiCepat Reguler', duration: '2-3 Days', price: 14000 },
    { id: 'rate_anteraja_reg', company: 'anteraja', courier_name: 'AnterAja', courier_service_name: 'REGULER', courier_service_code: 'reg', description: 'Layanan reguler AnterAja', duration: '2-3 Days', price: 13500 },
    { id: 'rate_ninja_dlv', company: 'ninja', courier_name: 'Ninja Van', courier_service_name: 'DELIVERY', courier_service_code: 'dlv', description: 'Layanan Ninja Van - same day/next day', duration: 'Same Day', price: 22000 },
    { id: 'rate_pos_paket', company: 'pos', courier_name: 'POS Indonesia', courier_service_name: 'PAKET POS', courier_service_code: 'paket', description: 'Layanan paket POS Indonesia', duration: '3-5 Days', price: 11000 },
  ],
  available_couriers: ['jne', 'jnt', 'sicepat', 'anteraja', 'ninja', 'pos'],
};

export async function POST(req: Request) {
  try {
    const { destination_area_id, origin_area_id, items, couriers } = await req.json();
    const apiKey = process.env.BITESHIP_API_KEY;

    // Try real Biteship API if key is configured
    if (apiKey && apiKey !== 'your_biteship_api_key_here') {
      try {
        const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination_area_id,
            origin_area_id: origin_area_id || undefined,
            items: items || [],
            couriers: couriers || 'jne,jnt,sicepat,anteraja,ninja,pos',
          }),
        });

        const data = await response.json();

        // If success, return real data
        if (response.ok && data.success !== false) {
          return NextResponse.json({ ...data, source: 'biteship' });
        }

        // If rates API error (no balance), fall back to mock
        if (!response.ok || data.success === false) {
          console.warn(`[Biteship Rates] API returned error, using fallback mock data: ${JSON.stringify(data)}`);
          return NextResponse.json({ ...MOCK_RATES, reason: data.error || 'API unavailable' });
        }

      } catch (apiErr) {
        // Network or other error — fall back to mock
        console.warn('[Biteship Rates] API call failed, using fallback mock:', (apiErr as Error).message);
      }
    }

    // Fallback mock data — works without API activation
    return NextResponse.json(MOCK_RATES);

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Rates] Error:', error.message);
    // Still return mock data on unexpected error
    return NextResponse.json({ ...MOCK_RATES, reason: error.message });
  }
}
