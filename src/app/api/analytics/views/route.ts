import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(request: Request) {
  let slug: string | null = null;
  try {
    const { searchParams } = new URL(request.url);
    slug = searchParams.get('slug');
    const all = searchParams.get('all') === 'true';

    if (!slug && !all) {
      return NextResponse.json({ error: 'Slug or all parameter is required' }, { status: 400 });
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!propertyId || !clientEmail || !privateKey) {
      return NextResponse.json({ views: 0, allViews: null, source: 'no-config' });
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    // Use runReport to get ACCUMULATED total screenPageViews (not just active users)
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: '2024-01-01', endDate: 'today' },
      ],
      dimensions: [
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'screenPageViews' },
      ],
    });

    if (all) {
      // Return accumulated views for ALL product pages
      const allViews: Record<string, number> = {};
      response.rows?.forEach((row) => {
        const pagePath = row.dimensionValues?.[0]?.value || '';
        const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
        if (pagePath && views > 0) {
          // Extract slug from path like /shop/product-slug
          const pathSlug = pagePath.replace(/^\/shop\//, '').replace(/\/$/, '');
          if (pathSlug && pagePath.startsWith('/shop/') && pathSlug !== '' && !pathSlug.includes('/')) {
            // Accumulate views for same slug (could have trailing slash variants)
            allViews[pathSlug] = (allViews[pathSlug] || 0) + views;
          }
        }
      });
      return NextResponse.json({ allViews, source: 'ga4' });
    }

    // Single product: find accumulated views matching the slug
    let totalViews = 0;

    if (response.rows && response.rows.length > 0) {
      response.rows.forEach((row) => {
        const pagePath = (row.dimensionValues?.[0]?.value || '').toLowerCase();
        const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
        // Match /shop/slug or /shop/slug/ or paths containing the slug
        if (pagePath.includes(slug!.toLowerCase())) {
          totalViews += views;
        }
      });
    }

    return NextResponse.json({ views: totalViews, source: 'ga4' });
  } catch (error) {
    console.error('[GA4 Analytics Error]:', error);
    return NextResponse.json({ views: 0, source: 'error' });
  }
}
