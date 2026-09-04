import { NextResponse } from 'next/server';
import { getMetaTrackingStatus } from '@/actions/metaTracking';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const data = await getMetaTrackingStatus();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Meta Tracking API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
