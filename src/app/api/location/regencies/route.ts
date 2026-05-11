import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get('province_id');

  if (!provinceId) {
    return NextResponse.json({ error: 'province_id is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error;
    console.error('[API/regencies] Fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch regencies' }, { status: 502 });
  }
}