import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // If GA is not configured, return null gracefully so the UI can hide the counter
    if (!propertyId || !clientEmail || !privateKey) {
      return NextResponse.json({ views: null });
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    // Query for active users in the last 30 minutes on this specific page path
    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [
        {
          name: 'unifiedScreenName',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
      ],
    });

    let activeUsers = 0;
    
    if (response.rows && response.rows.length > 0) {
      // Find the row that matches our product page
      const row = response.rows.find(
        (r) => r.dimensionValues?.[0]?.value?.includes(slug)
      );
      
      if (row && row.metricValues && row.metricValues.length > 0) {
        activeUsers = parseInt(row.metricValues[0].value || '0', 10);
      }
    }

    // fallback to pageviews if activeUsers is 0, optional, but let's just stick to activeUsers
    return NextResponse.json({ views: activeUsers });
  } catch (error) {
    console.error('Failed to fetch GA views:', error);
    // Don't leak the error, just return null to hide UI safely
    return NextResponse.json({ views: null });
  }
}
