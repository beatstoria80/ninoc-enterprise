import { NextResponse } from 'next/server';
import { getMetaAnalyticsData } from '@/actions/metaAnalytics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || '28d';
    
    const data = await getMetaAnalyticsData(filter);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Meta Ads API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
