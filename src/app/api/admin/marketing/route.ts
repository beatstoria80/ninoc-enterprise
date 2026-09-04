import { NextResponse } from 'next/server';
import { getMarketingAnalyticsData } from '@/actions/marketingAnalytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getMarketingAnalyticsData();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Marketing Analytics API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
