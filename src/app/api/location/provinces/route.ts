import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json', {
      next: { revalidate: 86400 } // cache 24 hours
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error;
    console.error('[API/provinces] Fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 502 });
  }
}