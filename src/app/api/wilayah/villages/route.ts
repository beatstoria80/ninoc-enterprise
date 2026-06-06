import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get('districtId');

  if (!districtId) {
    return NextResponse.json({ error: 'districtId is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${districtId}.json`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch villages' }, { status: response.status });
    }

    const villages = await response.json();
    return NextResponse.json(villages);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
