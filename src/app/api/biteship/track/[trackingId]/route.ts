/**
 * Biteship Tracking API
 * Returns real-time tracking data from Biteship.
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
      return NextResponse.json({ success: false, error: 'Layanan tracking belum dikonfigurasi.' }, { status: 500 });
    }

    try {
      const response = await fetch(`https://api.biteship.com/v1/trackings/${encodeURIComponent(trackingId)}`, {
        headers: { 'Authorization': apiKey },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ ...data, source: 'biteship' });
      }

      const errorBody = await response.text();
      console.warn(`[Biteship Tracking] API returned ${response.status}: ${errorBody}`);
      return NextResponse.json({ success: false, error: 'Data tracking tidak ditemukan atau belum tersedia.', tracking_id: trackingId }, { status: response.status === 404 ? 404 : 503 });

    } catch (apiErr) {
      console.error('[Biteship Tracking] API call failed:', (apiErr as Error).message);
      return NextResponse.json({ success: false, error: 'Gagal menghubungi layanan tracking. Silakan coba lagi.' }, { status: 503 });
    }

  } catch (err) {
    const error = err as Error;
    console.error('[Biteship Tracking] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}