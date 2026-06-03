/**
 * Biteship Tracking API
 * Returns real-time tracking data from Biteship
 */
import { NextResponse } from 'next/server';

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

    if (!apiKey || apiKey === 'your_biteship_api_key_here') {
      // Mock tracking response
      return NextResponse.json({
        success: true,
        tracking_id: trackingId,
        waybill_id: trackingId,
        courier_company: 'jne',
        courier_name: 'JNE Express',
        status: 'shipping',
        summary: {
          pickup: new Date(Date.now() - 86400000 * 2).toISOString(),
          last_updated: new Date().toISOString(),
        },
        history: [
          {
            id: '1',
            status: 'shipping',
            message: 'Paket sedang dalam perjalanan ke kota tujuan',
            occurred_at: new Date(Date.now() - 3600000).toISOString(),
            location: { name: 'HUB Jakarta' },
          },
          {
            id: '2',
            status: 'picked_up',
            message: 'Paket telah dijemput oleh kurir JNE',
            occurred_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            location: { name: 'NINOC Studio, Bandung' },
          },
          {
            id: '3',
            status: 'allocated',
            message: 'Paket berhasil terdaftar dalam sistem JNE',
            occurred_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            location: { name: 'NINOC Studio, Bandung' },
          },
        ],
        note: 'Mock mode — Biteship API not configured',
      });
    }

    // Real Biteship API call
    const response = await fetch(`https://api.biteship.com/v1/trackings/${trackingId}`, {
      headers: { 'Authorization': apiKey },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Biteship Tracking] API error:', errorBody);
      return NextResponse.json({ error: 'Tracking not found' }, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Tracking] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}