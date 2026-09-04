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

async function getEcommerceAnalytics(timeFilter: string, ga4TopPages: any[] = [], supplierId?: string) {
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

    let productQuery = supabaseAdmin
      .from('products')
      .select('id, name, category, price, image_url, slug, supplier_id, variants(stock_quantity)');

    if (supplierId && supplierId !== 'all') {
      productQuery = productQuery.eq('supplier_id', supplierId);
    }

    const { data: productsData, error: productsError } = await productQuery;

    if (productsError) {
      console.error('Error fetching products for ecommerce analytics:', productsError);
    }

    if (!productsData || productsData.length === 0) {
      return {
        totalUnitsSold: 0,
        totalRevenue: 0,
        conversionRate: 0,
        topCategories: [],
        topProducts: [],
      };
    }

    let orderItems: any[] = [];
    try {
      // FIX: Use inner join to prevent N+1 and URL too long errors on validOrderIds
      const { data: itemsData, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
          order_id, product_id, product_name, quantity, price_at_purchase,
          orders!inner(id, status, payment_status, created_at)
        `)
        .gte('orders.created_at', startDateObj);

      if (itemsError) throw itemsError;

      if (itemsData) {
        orderItems = itemsData.filter((item: any) => {
          const o = item.orders;
          if (!o) return false;
          return o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered' || o.payment_status === 'success' || o.status === 'completed';
        });
      }
    } catch (err) {
      console.warn('Error fetching order items with inner join:', err);
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
        const matchPages = ga4TopPages.filter(gp => {
          if (p.slug && (gp.path.includes(`/${p.slug}`) || gp.path.includes(p.slug))) return true;
          if (p.name && gp.title.toLowerCase().includes(p.name.toLowerCase())) return true;
          if (p.name) {
            const nameSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (nameSlug.length > 3 && gp.path.includes(nameSlug)) return true;
          }
          return false;
        });
        views = matchPages.reduce((sum, gp) => sum + (Number(gp.views) || 0), 0);
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
        stock: p.variants ? p.variants.reduce((s: number, v: any) => s + (Number(v.stock_quantity) || 0), 0) : 0,
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

export async function getWebAnalyticsData(timeFilter: string = '28d', supplierId?: string): Promise<WebAnalyticsData> {
  try {
    if (!isConfigured()) {
      const ecommerceData = await getEcommerceAnalytics(timeFilter, [], supplierId);
      return { configured: false, ga4: null, gsc: null, ecommerce: ecommerceData };
    }

    const token = await getAccessToken();
    let ga4Data = null;
    let gscData = null;
    let allGa4Pages: { path: string; title: string; views: number; users: number }[] = [];

    let gaStartDate = '28daysAgo';
    let gscDaysBack = 28;
    if (timeFilter === '24h') {
      gaStartDate = '1daysAgo'; gscDaysBack = 2;
    } else if (timeFilter === '7d') {
      gaStartDate = '7daysAgo'; gscDaysBack = 7;
    } else if (timeFilter === '28d') {
      gaStartDate = '28daysAgo'; gscDaysBack = 28;
    } else if (timeFilter === '90d') {
      gaStartDate = '90daysAgo'; gscDaysBack = 90;
    } else if (timeFilter === 'all') {
      gaStartDate = '365daysAgo'; gscDaysBack = 365;
    }

    // --- Helper for GA4 ---
    const fetchGa = async (endpoint: string, bodyObj: any) => {
      try {
        const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:${endpoint}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || data.error.status);
        return data;
      } catch (e: any) {
        console.warn('GA4 fetch error:', e.message);
        return null;
      }
    };

    if (process.env.GA4_PROPERTY_ID) {
      const [gaTotal, gaTrend, gaRt, gaPages, gaCities, gaDev, gaChan] = await Promise.all([
        fetchGa('runReport', {
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }, { name: 'averageSessionDuration' }]
        }),
        fetchGa('runReport', {
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
        }),
        fetchGa('runRealtimeReport', { metrics: [{ name: 'activeUsers' }] }),
        fetchGa('runReport', {
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 500
        }),
        fetchGa('runReport', {
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
          dimensions: [{ name: 'city' }, { name: 'country' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 6
        }),
        fetchGa('runReport', {
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 4
        }),
        fetchGa('runReport', {
          dateRanges: [{ startDate: gaStartDate, endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 5
        })
      ]);

      const trend = (gaTrend?.rows || []).map((row: any) => ({
        date: row.dimensionValues?.[0]?.value ? `${row.dimensionValues[0].value.substring(0,4)}-${row.dimensionValues[0].value.substring(4,6)}-${row.dimensionValues[0].value.substring(6,8)}` : '',
        visitors: parseInt(row.metricValues?.[0]?.value || '0', 10),
        pageviews: parseInt(row.metricValues?.[1]?.value || '0', 10),
      }));

      const topPages = (gaPages?.rows || []).map((row: any) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        title: row.dimensionValues?.[1]?.value || 'Page',
        views: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
      }));
      allGa4Pages = topPages;

      const topCities = (gaCities?.rows || []).map((row: any) => ({
        city: row.dimensionValues?.[0]?.value || 'Unknown',
        country: row.dimensionValues?.[1]?.value || 'ID',
        users: parseInt(row.metricValues?.[0]?.value || '0', 10),
        views: parseInt(row.metricValues?.[1]?.value || '0', 10),
      }));

      const totalDevUsers = (gaDev?.rows || []).reduce((sum: number, r: any) => sum + parseInt(r.metricValues?.[0]?.value || '0', 10), 0) || 1;
      const devices = (gaDev?.rows || []).map((row: any) => {
        const u = parseInt(row.metricValues?.[0]?.value || '0', 10);
        return {
          device: row.dimensionValues?.[0]?.value || 'desktop',
          users: u,
          percentage: Math.round((u / totalDevUsers) * 100),
        };
      });

      const channels = (gaChan?.rows || []).map((row: any) => ({
        channel: row.dimensionValues?.[0]?.value || 'Direct',
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
      }));

      ga4Data = {
        realtimeVisitors: parseInt(gaRt?.rows?.[0]?.metricValues?.[0]?.value || '0', 10),
        visitors: parseInt(gaTotal?.rows?.[0]?.metricValues?.[0]?.value || '0', 10),
        pageviews: parseInt(gaTotal?.rows?.[0]?.metricValues?.[1]?.value || '0', 10),
        sessions: parseInt(gaTotal?.rows?.[0]?.metricValues?.[2]?.value || '0', 10),
        avgSessionDuration: parseFloat(gaTotal?.rows?.[0]?.metricValues?.[3]?.value || '0').toFixed(2) + 's',
        trend,
        topPages: topPages.slice(0, 10),
        topCities,
        devices,
        channels,
      };
    }

    // --- Helper for GSC ---
    if (process.env.GSC_SITE_URL) {
      const siteUrl = process.env.GSC_SITE_URL;
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - gscDaysBack * 24 * 60 * 60 * 1000);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      const startStr = formatDate(thirtyDaysAgo);
      const endStr = formatDate(today);

      const fetchGsc = async (bodyObj: any) => {
        try {
          const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || data.error.status);
          return data;
        } catch (e: any) {
          console.warn('GSC fetch error:', e.message);
          return null;
        }
      };

      const [gscTotal, gscQueries, gscTrend, gscPages, gscCountries, gscDev] = await Promise.all([
        fetchGsc({ startDate: startStr, endDate: endStr }),
        fetchGsc({ startDate: startStr, endDate: endStr, dimensions: ['query'], rowLimit: 10 }),
        fetchGsc({ startDate: startStr, endDate: endStr, dimensions: ['date'] }),
        fetchGsc({ startDate: startStr, endDate: endStr, dimensions: ['page'], rowLimit: 8 }),
        fetchGsc({ startDate: startStr, endDate: endStr, dimensions: ['country'], rowLimit: 6 }),
        fetchGsc({ startDate: startStr, endDate: endStr, dimensions: ['device'], rowLimit: 4 })
      ]);

      const trend = (gscTrend?.rows || []).map((row: any) => ({
        date: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: (row.ctr || 0) * 100,
        position: row.position || 0,
      })).sort((a: any, b: any) => a.date.localeCompare(b.date));

      const topPages = (gscPages?.rows || []).map((row: any) => {
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

      const topCountries = (gscCountries?.rows || []).map((row: any) => ({
        country: (row.keys?.[0] || 'id').toUpperCase(),
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: (row.ctr || 0) * 100,
      }));

      const devices = (gscDev?.rows || []).map((row: any) => ({
        device: row.keys?.[0] || 'DESKTOP',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: (row.ctr || 0) * 100,
      }));

      const totals = gscTotal?.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const topQueries = (gscQueries?.rows || []).map((row: any) => ({
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

    const ecommerceData = await getEcommerceAnalytics(timeFilter, allGa4Pages, supplierId);

    const result = {
      configured: true,
      ga4: ga4Data,
      gsc: gscData,
      ecommerce: ecommerceData,
    };
    return JSON.parse(JSON.stringify(result));

  } catch (error) {
    console.error('Error fetching Web Analytics data:', error);
    const ecommerceData = await getEcommerceAnalytics(timeFilter, [], supplierId);
    const fallbackResult = {
      configured: true,
      ga4: null,
      gsc: null,
      ecommerce: ecommerceData,
      error: 'Google Analytics/Search Console API error. Please check logs.',
    };
    return JSON.parse(JSON.stringify(fallbackResult));
  }
}