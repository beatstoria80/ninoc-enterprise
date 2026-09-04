import { NextResponse } from 'next/server';
import { getWebAnalyticsData } from '@/actions/webAnalytics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || '28d';
    const supplierId = searchParams.get('supplierId') || undefined;
    
    const data = await getWebAnalyticsData(filter, supplierId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Web Analytics API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
