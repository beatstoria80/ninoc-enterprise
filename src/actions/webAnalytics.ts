"use server";

import { GoogleAuth } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

export type WebAnalyticsData = {
  configured: boolean;
  ga4: {
    realtimeVisitors: number;
    visitors: number;
    pageviews: number;
    sessions: number;
    avgSessionDuration: string;
    trend: { date: string; visitors: number; pageviews: number }[];
    topPages?: { path: string; title: string; views: number; users: number }[];
    topCities?: { city: string; country: string; users: number; views: number }[];
    devices?: { device: string; users: number; percentage: number }[];
    channels?: { channel: string; sessions: number; users: number }[];
  } | null;
  gsc: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    topQueries: { query: string; clicks: number; impressions: number; ctr?: number; position?: number }[];
    trend?: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
    topPages?: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
    topCountries?: { country: string; clicks: number; impressions: number; ctr: number }[];
    devices?: { device: string; clicks: number; impressions: number; ctr: number }[];
  } | null;
  ecommerce?: {
    totalUnitsSold: number;
    totalRevenue: number;
    conversionRate: number;
    topCategories: {
      category: string;
      views: number;
      sold: number;
      revenue: number;
      percentage: number;
      growth: string;
    }[];
    topProducts: {
      id: string;
      name: string;
      category: string;
      image_url?: string;
      price: number;
      views: number;
      sold: number;
      revenue: number;
      stock: number;
      conversionRate: number;
    }[];
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

async function getEcommerceAnalytics(timeFilter: string, ga4TopPages: any[] = []) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        totalUnitsSold: 0,
        totalRevenue: 0,
        conversionRate: 0,
        topCategories: [],
        topProducts: [],
      };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    let daysBack = 28;
    if (timeFilter === '24h') daysBack = 1;
    else if (timeFilter === '7d') daysBack = 7;
    else if (timeFilter === '28d') daysBack = 28;
    else if (timeFilter === '90d') daysBack = 90;
    else if (timeFilter === 'all') daysBack = 365;

    const startDateObj = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const { data: productsData } = await supabaseAdmin
      .from('products')
      .select('id, name, category, price, stock, image_url, slug');

    if (!productsData || productsData.length === 0) {
      return {
        totalUnitsSold: 0,
        totalRevenue: 0,
        conversionRate: 0,
        topCategories: [],
        topProducts: [],
      };
    }

    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status, total_price, created_at')
      .gte('created_at', startDateObj);

    const validOrders = (ordersData || []).filter(o => 
      o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered' || o.payment_status === 'success' || o.status === 'completed'
    );
    const validOrderIds = validOrders.map(o => o.id);

    let orderItems: any[] = [];
    if (validOrderIds.length > 0) {
      const { data: itemsData } = await supabaseAdmin
        .from('order_items')
        .select('order_id, product_id, product_name, quantity, price_at_purchase')
        .in('order_id', validOrderIds);
      if (itemsData) orderItems = itemsData;
    }

    let totalUnitsSold = 0;
    let totalRevenue = 0;
    let totalViews = 0;

    const topProducts = productsData.map(p => {
      const matchingItems = orderItems.filter(item => 
        (item.product_id && item.product_id === p.id) || 
        (item.product_name && item.product_name.toLowerCase() === p.name?.toLowerCase())
      );

      const sold = matchingItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const rev = matchingItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price_at_purchase) || Number(p.price) || 0)), 0);

      let views = 0;
      if (ga4TopPages && ga4TopPages.length > 0) {
        const matchPage = ga4TopPages.find(gp => 
          (p.slug && gp.path.includes(p.slug)) || 
          (p.name && gp.title.toLowerCase().includes(p.name.toLowerCase()))
        );
        if (matchPage) {
          views = matchPage.views;
        }
      }

      totalUnitsSold += sold;
      totalRevenue += rev;
      totalViews += views;

      const conversionRate = views > 0 ? (sold / views) * 100 : 0;

      return {
        id: p.id || Math.random().toString(),
        name: p.name || 'Produk NINOC',
        category: p.category || 'General',
        image_url: p.image_url || '/placeholder.png',
        price: Number(p.price) || 0,
        views,
        sold,
        revenue: rev,
        stock: Number(p.stock) || 0,
        conversionRate,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const catMap: Record<string, { category: string; views: number; sold: number; revenue: number }> = {};
    topProducts.forEach(p => {
      const cat = p.category || 'General';
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, views: 0, sold: 0, revenue: 0 };
      }
      catMap[cat].views += p.views;
      catMap[cat].sold += p.sold;
      catMap[cat].revenue += p.revenue;
    });

    const topCategories = Object.values(catMap).map(c => ({
      ...c,
      percentage: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0,
      growth: '+0%',
    })).sort((a, b) => b.revenue - a.revenue);

    const conversionRate = totalViews > 0 ? (totalUnitsSold / totalViews) * 100 : 0;

    return {
      totalUnitsSold,
      totalRevenue,
      conversionRate,
      topCategories,
      topProducts,
    };
  } catch (err) {
    console.error('Error computing ecommerce analytics:', err);
    return null;
  }
}

export async function getWebAnalyticsData(timeFilter: string = '28d'): Promise<WebAnalyticsData> {
  try {
    if (!isConfigured()) {
      const ecommerceData = await getEcommerceAnalytics(timeFilter, []);
      return { configured: false, ga4: null, gsc: null, ecommerce: ecommerceData };
    }

    const token = await getAccessToken();
    let ga4Data = null;
    let gscData = null;

    let gaStartDate = '28daysAgo';
    let gscDaysBack = 28;
    if (timeFilter === '24h') {
      gaStartDate = '1daysAgo';
      gscDaysBack = 2; // GSC requires minimum 2 days latency window
    } else if (timeFilter === '7d') {
      gaStartDate = '7daysAgo';
      gscDaysBack = 7;
    } else if (timeFilter === '28d') {
      gaStartDate = '28daysAgo';
      gscDaysBack = 28;
    } else if (timeFilter === '90d') {
      gaStartDate = '90daysAgo';
      gscDaysBack = 90;
    } else if (timeFilter === 'all') {
      gaStartDate = '365daysAgo';
      gscDaysBack = 365;
    }

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
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
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
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
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

      // Top Pages
      let topPages: { path: string; title: string; views: number; users: number }[] = [];
      try {
        const gaPagesRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 8
          })
        });
        const gaPagesData = await gaPagesRes.json();
        if (!gaPagesData.error && gaPagesData.rows) {
          topPages = gaPagesData.rows.map((row: any) => ({
            path: row.dimensionValues?.[0]?.value || '/',
            title: row.dimensionValues?.[1]?.value || 'Page',
            views: parseInt(row.metricValues?.[0]?.value || '0', 10),
            users: parseInt(row.metricValues?.[1]?.value || '0', 10),
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch GA4 top pages', e);
      }

      // Top Cities (Wilayah Demografi)
      let topCities: { city: string; country: string; users: number; views: number }[] = [];
      try {
        const gaCitiesRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
            dimensions: [{ name: 'city' }, { name: 'country' }],
            metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: 6
          })
        });
        const gaCitiesData = await gaCitiesRes.json();
        if (!gaCitiesData.error && gaCitiesData.rows) {
          topCities = gaCitiesData.rows.map((row: any) => ({
            city: row.dimensionValues?.[0]?.value || 'Unknown',
            country: row.dimensionValues?.[1]?.value || 'ID',
            users: parseInt(row.metricValues?.[0]?.value || '0', 10),
            views: parseInt(row.metricValues?.[1]?.value || '0', 10),
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch GA4 top cities', e);
      }

      // Devices (Perangkat)
      let devices: { device: string; users: number; percentage: number }[] = [];
      try {
        const gaDevRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: 4
          })
        });
        const gaDevData = await gaDevRes.json();
        if (!gaDevData.error && gaDevData.rows) {
          const totalDevUsers = gaDevData.rows.reduce((sum: number, r: any) => sum + parseInt(r.metricValues?.[0]?.value || '0', 10), 0) || 1;
          devices = gaDevData.rows.map((row: any) => {
            const u = parseInt(row.metricValues?.[0]?.value || '0', 10);
            return {
              device: row.dimensionValues?.[0]?.value || 'desktop',
              users: u,
              percentage: Math.round((u / totalDevUsers) * 100),
            };
          });
        }
      } catch (e) {
        console.warn('Failed to fetch GA4 devices', e);
      }

      // Traffic Channels (Sumber Akuisisi)
      let channels: { channel: string; sessions: number; users: number }[] = [];
      try {
        const gaChanRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 5
          })
        });
        const gaChanData = await gaChanRes.json();
        if (!gaChanData.error && gaChanData.rows) {
          channels = gaChanData.rows.map((row: any) => ({
            channel: row.dimensionValues?.[0]?.value || 'Direct',
            sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
            users: parseInt(row.metricValues?.[1]?.value || '0', 10),
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch GA4 channels', e);
      }

      ga4Data = {
        realtimeVisitors,
        visitors: parseInt(gaData.rows?.[0]?.metricValues?.[0]?.value || '0', 10),
        pageviews: parseInt(gaData.rows?.[0]?.metricValues?.[1]?.value || '0', 10),
        sessions: parseInt(gaData.rows?.[0]?.metricValues?.[2]?.value || '0', 10),
        avgSessionDuration: parseFloat(gaData.rows?.[0]?.metricValues?.[3]?.value || '0').toFixed(2) + 's',
        trend,
        topPages,
        topCities,
        devices,
        channels,
      };
    }

    // Fetch GSC Data via REST API
    if (process.env.GSC_SITE_URL) {
      const siteUrl = process.env.GSC_SITE_URL;
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - gscDaysBack * 24 * 60 * 60 * 1000);
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
          rowLimit: 10
        })
      });
      const gscQueriesData = await gscQueriesRes.json();
      if (gscQueriesData.error) {
        throw new Error(`GSC Queries API Error: ${gscQueriesData.error.message || gscQueriesData.error.status}`);
      }

      // GSC Daily Trend
      let trend: { date: string; clicks: number; impressions: number; ctr: number; position: number }[] = [];
      try {
        const gscTrendRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: formatDate(thirtyDaysAgo),
            endDate: formatDate(today),
            dimensions: ['date']
          })
        });
        const gscTrendData = await gscTrendRes.json();
        if (!gscTrendData.error && gscTrendData.rows) {
          trend = gscTrendData.rows.map((row: any) => ({
            date: row.keys?.[0] || '',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: (row.ctr || 0) * 100,
            position: row.position || 0,
          })).sort((a: any, b: any) => a.date.localeCompare(b.date));
        }
      } catch (e) {
        console.warn('Failed to fetch GSC trend', e);
      }

      // GSC Top Landing Pages
      let topPages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[] = [];
      try {
        const gscPagesRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: formatDate(thirtyDaysAgo),
            endDate: formatDate(today),
            dimensions: ['page'],
            rowLimit: 8
          })
        });
        const gscPagesData = await gscPagesRes.json();
        if (!gscPagesData.error && gscPagesData.rows) {
          topPages = gscPagesData.rows.map((row: any) => {
            let pageUrl = row.keys?.[0] || '/';
            if (pageUrl.startsWith('http')) {
              try {
                const u = new URL(pageUrl);
                pageUrl = u.pathname + u.search;
              } catch {}
            }
            return {
              page: pageUrl,
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: (row.ctr || 0) * 100,
              position: row.position || 0,
            };
          });
        }
      } catch (e) {
        console.warn('Failed to fetch GSC top pages', e);
      }

      // GSC Top Countries
      let topCountries: { country: string; clicks: number; impressions: number; ctr: number }[] = [];
      try {
        const gscCountriesRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: formatDate(thirtyDaysAgo),
            endDate: formatDate(today),
            dimensions: ['country'],
            rowLimit: 6
          })
        });
        const gscCountriesData = await gscCountriesRes.json();
        if (!gscCountriesData.error && gscCountriesData.rows) {
          topCountries = gscCountriesData.rows.map((row: any) => ({
            country: (row.keys?.[0] || 'id').toUpperCase(),
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: (row.ctr || 0) * 100,
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch GSC top countries', e);
      }

      // GSC Devices
      let devices: { device: string; clicks: number; impressions: number; ctr: number }[] = [];
      try {
        const gscDevRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: formatDate(thirtyDaysAgo),
            endDate: formatDate(today),
            dimensions: ['device'],
            rowLimit: 4
          })
        });
        const gscDevData = await gscDevRes.json();
        if (!gscDevData.error && gscDevData.rows) {
          devices = gscDevData.rows.map((row: any) => ({
            device: row.keys?.[0] || 'DESKTOP',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: (row.ctr || 0) * 100,
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch GSC devices', e);
      }

      const totals = gscTotalData.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const topQueries = (gscQueriesData.rows || []).map((row: any) => ({
        query: row.keys?.[0] || 'Unknown',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: (row.ctr || 0) * 100,
        position: row.position || 0,
      }));

      gscData = {
        clicks: totals.clicks || 0,
        impressions: totals.impressions || 0,
        ctr: (totals.ctr || 0) * 100,
        position: totals.position || 0,
        topQueries,
        trend,
        topPages,
        topCountries,
        devices,
      };
    }

    const ecommerceData = await getEcommerceAnalytics(timeFilter, ga4Data?.topPages || []);

    return {
      configured: true,
      ga4: ga4Data,
      gsc: gscData,
      ecommerce: ecommerceData,
    };

  } catch (error) {
    console.error('Error fetching Web Analytics data:', error);
    const ecommerceData = await getEcommerceAnalytics(timeFilter, []);
    return {
      configured: true,
      ga4: null,
      gsc: null,
      ecommerce: ecommerceData,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
