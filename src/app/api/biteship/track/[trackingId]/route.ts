/**
 * Biteship Tracking API
 * Returns real-time tracking data from Biteship
 * Uses mock data as fallback if API unavailable
 */
import { NextResponse } from 'next/server';

const MOCK_HISTORY = [
  { id: '1', status: 'allocated', message: 'Paket berhasil terdaftar dalam sistem kurir', occurred_at: new Date(Date.now() - 86400000 * 3).toISOString(), location: { name: 'NINOC Studio, Bandung' } },
  { id: '2', status: 'picked_up', message: 'Paket telah dijemput oleh kurir', occurred_at: new Date(Date.now() - 86400000 * 2).toISOString(), location: { name: 'NINOC Studio, Bandung' } },
  { id: '3', status: 'shipping', message: 'Paket sedang dalam perjalanan ke kota tujuan', occurred_at: new Date(Date.now() - 3600000 * 8).toISOString(), location: { name: 'HUB Bandung' } },
];

function getMockTrackingResponse(trackingId: string, courierCompany: string) {
  // Parse courier from tracking ID prefix
  const courierMap: Record<string, string> = {
    'JNE': 'JNE Express',
    'JNT': 'J&T Express',
    'SIC': 'SiCepat',
    'ANT': 'AnterAja',
    'NIN': 'Ninja Van',
    'NNC': 'NINOC Mock',
  };
  const prefix = trackingId.slice(0, 3);
  return {
    success: true,
    source: 'mock',
    tracking_id: trackingId,
    waybill_id: trackingId,
    courier_company: courierCompany || 'jne',
    courier_name: courierMap[prefix] || 'Kurir',
    status: 'shipping',
    estimated_pickup_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    estimated_delivery_date: new Date(Date.now() + 86400000).toISOString(),
    summary: {
      pickup: new Date(Date.now() - 86400000 * 2).toISOString(),
      last_updated: new Date(Date.now() - 3600000).toISOString(),
    },
    history: MOCK_HISTORY,
    note: 'Mock tracking — Biteship API unavailable or tracking ID not found',
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;

    if (!trackingId) {
      return NextResponse.json({ error: 'Tracking ID required' }, { status: 400 });
    }

    const apiKey = process.env.BITESHIP_API_KEY;

    // Try real Biteship API
    if (apiKey && apiKey !== 'your_biteship_api_key_here') {
      try {
        const response = await fetch(`https://api.biteship.com/v1/trackings/${encodeURIComponent(trackingId)}`, {
          headers: { 'Authorization': apiKey },
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ ...data, source: 'biteship' });
        }

        // Not found or error — fall back to mock
        const errorBody = await response.text();
        console.warn(`[Biteship Tracking] API returned ${response.status}: ${errorBody}`);

      } catch (apiErr) {
        console.warn('[Biteship Tracking] API call failed, using mock:', (apiErr as Error).message);
      }
    }

    // Fallback mock response
    return NextResponse.json(getMockTrackingResponse(trackingId, ''));

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Tracking] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}