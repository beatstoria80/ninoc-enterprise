"use server";

import { GoogleAuth } from 'google-auth-library';

export type WebAnalyticsData = {
  configured: boolean;
  ga4: {
    realtimeVisitors: number;
    visitors: number;
    pageviews: number;
    sessions: number;
    avgSessionDuration: string;
    trend: { date: string; visitors: number; pageviews: number }[];
  } | null;
  gsc: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    topQueries: { query: string; clicks: number; impressions: number }[];
  } | null;
  error?: string;
};

const isConfigured = () => {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    (process.env.GA4_PROPERTY_ID || process.env.GSC_SITE_URL)
  );
};

// Gets a valid access token using the already installed google-auth-library
async function getAccessToken(): Promise<string> {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  
  // Strip surrounding quotes (single or double)
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  
  // Handle all newline escape variations from Vercel env vars
  privateKey = privateKey.replace(/\\\\n/g, '\n'); // double-escaped \\n
  privateKey = privateKey.replace(/\\n/g, '\n');    // single-escaped \n
  
  // Validate key format
  if (!privateKey.includes('-----BEGIN')) {
    console.error('[WebAnalytics] GOOGLE_PRIVATE_KEY tidak mengandung header PEM yang valid. Panjang key:', privateKey.length);
    throw new Error('GOOGLE_PRIVATE_KEY format tidak valid. Pastikan key mengandung "-----BEGIN PRIVATE KEY-----"');
  }
  
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Failed to get Google Access Token");
  return token.token;
}

export async function getWebAnalyticsData(): Promise<WebAnalyticsData> {
  try {
    if (!isConfigured()) {
      return { configured: false, ga4: null, gsc: null };
    }

    const token = await getAccessToken();
    let ga4Data = null;
    let gscData = null;

    // Fetch GA4 Data via REST API
    if (process.env.GA4_PROPERTY_ID) {
      const propertyId = process.env.GA4_PROPERTY_ID;
      
      // Totals
      const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' }
          ]
        })
      });
      const gaData = await gaRes.json();
      if (gaData.error) {
        throw new Error(`GA4 API Error: ${gaData.error.message || gaData.error.status}`);
      }

      // Trend
      const gaTrendRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
        })
      });
      const gaTrendData = await gaTrendRes.json();
      if (gaTrendData.error) {
        throw new Error(`GA4 Trend API Error: ${gaTrendData.error.message || gaTrendData.error.status}`);
      }

      const trend = (gaTrendData.rows || []).map((row: any) => ({
        date: row.dimensionValues?.[0]?.value ? 
              `${row.dimensionValues[0].value.substring(0,4)}-${row.dimensionValues[0].value.substring(4,6)}-${row.dimensionValues[0].value.substring(6,8)}` : '',
        visitors: parseInt(row.metricValues?.[0]?.value || '0', 10),
        pageviews: parseInt(row.metricValues?.[1]?.value || '0', 10),
      }));

      // Realtime (last 30 minutes)
      let realtimeVisitors = 0;
      try {
        const gaRtRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metrics: [{ name: 'activeUsers' }]
          })
        });
        const gaRtData = await gaRtRes.json();
        if (gaRtData.error) {
          throw new Error(`GA4 Realtime API Error: ${gaRtData.error.message || gaRtData.error.status}`);
        }
        realtimeVisitors = parseInt(gaRtData.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
      } catch (e: any) {
        throw new Error(e.message || "Failed to fetch realtime data");
      }

      ga4Data = {
        realtimeVisitors,
        visitors: parseInt(gaData.rows?.[0]?.metricValues?.[0]?.value || '0', 10),
        pageviews: parseInt(gaData.rows?.[0]?.metricValues?.[1]?.value || '0', 10),
        sessions: parseInt(gaData.rows?.[0]?.metricValues?.[2]?.value || '0', 10),
        avgSessionDuration: parseFloat(gaData.rows?.[0]?.metricValues?.[3]?.value || '0').toFixed(2) + 's',
        trend,
      };
    }

    // Fetch GSC Data via REST API
    if (process.env.GSC_SITE_URL) {
      const siteUrl = process.env.GSC_SITE_URL;
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      // Totals
      const gscTotalRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: formatDate(thirtyDaysAgo),
          endDate: formatDate(today)
        })
      });
      const gscTotalData = await gscTotalRes.json();
      if (gscTotalData.error) {
        throw new Error(`GSC API Error: ${gscTotalData.error.message || gscTotalData.error.status}`);
      }

      // Top queries
      const gscQueriesRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: formatDate(thirtyDaysAgo),
          endDate: formatDate(today),
          dimensions: ['query'],
          rowLimit: 5
        })
      });
      const gscQueriesData = await gscQueriesRes.json();
      if (gscQueriesData.error) {
        throw new Error(`GSC Queries API Error: ${gscQueriesData.error.message || gscQueriesData.error.status}`);
      }

      const totals = gscTotalData.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const topQueries = (gscQueriesData.rows || []).map((row: any) => ({
        query: row.keys?.[0] || 'Unknown',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
      }));

      gscData = {
        clicks: totals.clicks || 0,
        impressions: totals.impressions || 0,
        ctr: (totals.ctr || 0) * 100,
        position: totals.position || 0,
        topQueries,
      };
    }

    return {
      configured: true,
      ga4: ga4Data,
      gsc: gscData,
    };

  } catch (error) {
    console.error('Error fetching Web Analytics data:', error);
    return {
      configured: true,
      ga4: null,
      gsc: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
