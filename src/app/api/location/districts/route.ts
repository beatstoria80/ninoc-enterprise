import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get('city_id');

  if (!cityId) {
    return NextResponse.json({ error: 'city_id is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${cityId}.json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error;
    console.error('[API/districts] Fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 502 });
  }
}