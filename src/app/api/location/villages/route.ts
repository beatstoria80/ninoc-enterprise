import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get('district_id');

  if (!districtId) {
    return NextResponse.json({ error: 'district_id is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${districtId}.json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error;
    console.error('[API/villages] Fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch villages' }, { status: 502 });
  }
}