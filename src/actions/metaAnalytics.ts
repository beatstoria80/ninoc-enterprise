"use server";

// Types for Meta Analytics Data
export interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
}

export interface MetaDemographics {
  ageGender: { segment: string; percentage: number }[];
  topLocations: { city: string; percentage: number }[];
}

export interface MetaAnalyticsData {
  configured: boolean;
  error?: string;
  overview: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageCtr: number;
    averageRoas: number;
  };
  campaigns: MetaCampaign[];
  demographics: MetaDemographics;
  trend: { date: string; spend: number; conversions: number }[];
}

export interface MetaOrganicData {
  configured: boolean;
  error?: string;
  followers: number;
  reach: number;
  profileViews: number;
  engagement: number;
  trend: { date: string; reach: number; engagement: number }[];
}

// Constant values for Meta Graph API
const GRAPH_API_VERSION = 'v19.0';
const BASE_GRAPH_URL = 'https://graph.facebook.com';
const CACHE_REVALIDATE_SECONDS = 300; // 5 minutes

/**
 * Reusable HTTP Request Wrapper for Facebook Graph API.
 * Handles unified parameters, error boundary decoding, and revalidation logic.
 */
async function metaGraphFetch<T = any>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string | number> = {},
  revalidate = CACHE_REVALIDATE_SECONDS
): Promise<T> {
  const queryParams = new URLSearchParams();
  queryParams.set('access_token', accessToken);
  
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      queryParams.set(key, String(val));
    }
  });

  const url = `${BASE_GRAPH_URL}/${GRAPH_API_VERSION}/${endpoint}?${queryParams.toString()}`;
  const res = await fetch(url, {
    next: { revalidate }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || `Facebook Graph API error (status: ${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/**
 * Helper to parse conversion action arrays and extract total purchases.
 */
function getPurchasesCount(actions: any[] | undefined): number {
  if (!actions || !Array.isArray(actions)) return 0;
  const purchaseAction = actions.find(
    a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
  );
  return purchaseAction ? parseInt(purchaseAction.value || 0, 10) : 0;
}

/**
 * Maps dashboard timeFilter to Facebook's date_preset parameter.
 */
function getAdsDatePreset(timeFilter: string): string {
  switch (timeFilter) {
    case '24h': return 'today';
    case '7d': return 'last_7d';
    case '90d': return 'last_90d';
    case 'all': return 'maximum';
    default: return 'last_28d';
  }
}

/**
 * Calculates unix timestamp ranges for organic metrics.
 */
function getOrganicUnixRange(timeFilter: string): { sinceUnix: number; untilUnix: number } {
  const until = new Date();
  const since = new Date();

  switch (timeFilter) {
    case '24h':
      since.setDate(until.getDate() - 1);
      break;
    case '7d':
      since.setDate(until.getDate() - 7);
      break;
    case '90d':
      since.setDate(until.getDate() - 90);
      break;
    default: // 28d
      since.setDate(until.getDate() - 28);
      break;
  }

  return {
    sinceUnix: Math.floor(since.getTime() / 1000),
    untilUnix: Math.floor(until.getTime() / 1000)
  };
}

/**
 * Helper to generate realistic and pretty Mock Organic Data for Meta
 */
function generateMockOrganicData(timeFilter: string): MetaOrganicData {
  let days = 28;
  if (timeFilter === '7d') days = 7;
  if (timeFilter === '24h') days = 1;
  if (timeFilter === '90d') days = 90;

  const trend: { date: string; reach: number; engagement: number }[] = [];
  let totalReach = 0;
  let totalEngagement = 0;
  let totalProfileViews = 0;

  const baseReach = 2500;
  const baseEngagement = 350;
  const baseViews = 180;

  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Create natural variations in mock data
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
    const dailyReach = Math.floor(baseReach * randomFactor);
    const dailyEngagement = Math.floor(baseEngagement * randomFactor * 0.8);
    const dailyViews = Math.floor(baseViews * randomFactor * 0.9);

    totalReach += dailyReach;
    totalEngagement += dailyEngagement;
    totalProfileViews += dailyViews;

    trend.push({
      date: dateStr,
      reach: dailyReach,
      engagement: dailyEngagement
    });
  }

  return {
    configured: true,
    followers: 12840,
    reach: totalReach,
    profileViews: totalProfileViews,
    engagement: totalEngagement,
    trend
  };
}

/**
 * Fetch Meta Analytics Data (Facebook/Instagram Ads)
 */
export async function getMetaAnalyticsData(timeFilter: string = '28d'): Promise<MetaAnalyticsData> {
  const capiToken = process.env.META_CAPI_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!capiToken || !adAccountId) {
    return {
      configured: false,
      overview: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, averageCtr: 0, averageRoas: 0 },
      campaigns: [],
      demographics: { ageGender: [], topLocations: [] },
      trend: []
    };
  }

  const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const datePreset = getAdsDatePreset(timeFilter);

  try {
    // 1. Fetch Overview Insights
    const overviewData = await metaGraphFetch(
      `${formattedAdAccountId}/insights`,
      capiToken,
      {
        date_preset: datePreset,
        fields: 'spend,impressions,clicks,actions'
      }
    );

    const insights = overviewData.data && overviewData.data.length > 0 ? overviewData.data[0] : null;
    const totalSpend = insights ? parseFloat(insights.spend || 0) : 0;
    const totalImpressions = insights ? parseInt(insights.impressions || 0, 10) : 0;
    const totalClicks = insights ? parseInt(insights.clicks || 0, 10) : 0;
    const totalConversions = insights ? getPurchasesCount(insights.actions) : 0;
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageRoas = totalSpend > 0 && totalConversions > 0 ? ((totalConversions * 150000) / totalSpend) : 0; // Assuming 150k AOV for demo

    const overview = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      averageCtr: parseFloat(averageCtr.toFixed(2)),
      averageRoas: parseFloat(averageRoas.toFixed(2))
    };

    // 2. Fetch Campaigns
    const campaignsData = await metaGraphFetch(
      `${formattedAdAccountId}/campaigns`,
      capiToken,
      {
        date_preset: datePreset,
        fields: 'id,name,status,insights{spend,impressions,clicks,actions}'
      }
    );

    const campaigns: MetaCampaign[] = (campaignsData.data || []).map((camp: any) => {
      const cInsights = camp.insights?.data?.[0];
      const cSpend = cInsights ? parseFloat(cInsights.spend || 0) : 0;
      const cConversions = cInsights ? getPurchasesCount(cInsights.actions) : 0;
      const cRoas = cSpend > 0 && cConversions > 0 ? ((cConversions * 150000) / cSpend) : 0;

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status as 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
        spend: cSpend,
        impressions: cInsights ? parseInt(cInsights.impressions || 0, 10) : 0,
        clicks: cInsights ? parseInt(cInsights.clicks || 0, 10) : 0,
        conversions: cConversions,
        roas: parseFloat(cRoas.toFixed(2))
      };
    });

    // 3. Fetch Trend Data (Time Increment)
    const trendData = await metaGraphFetch(
      `${formattedAdAccountId}/insights`,
      capiToken,
      {
        date_preset: datePreset,
        time_increment: 1,
        fields: 'date_start,spend,actions'
      }
    );
    
    const trend = (trendData.data || []).map((t: any) => ({
      date: t.date_start,
      spend: parseFloat(t.spend || 0),
      conversions: getPurchasesCount(t.actions)
    }));

    return {
      configured: true,
      overview,
      campaigns,
      demographics: { ageGender: [], topLocations: [] },
      trend
    };
  } catch (error: any) {
    console.error("Meta API Fetch Error:", error);
    return {
      configured: true,
      error: `Failed to fetch data from Meta: ${error.message}`,
      overview: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, averageCtr: 0, averageRoas: 0 },
      campaigns: [],
      demographics: { ageGender: [], topLocations: [] },
      trend: []
    };
  }
}

/**
 * Fetch Meta Organic Analytics Data (Facebook Page / Instagram Profile)
 */
export async function getMetaOrganicData(timeFilter: string = '28d'): Promise<MetaOrganicData> {
  const capiToken = process.env.META_CAPI_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!capiToken || !pageId) {
    const mock = generateMockOrganicData(timeFilter);
    mock.error = "Meta Page ID atau CAPI Token belum diatur di environment. Menampilkan data simulasi.";
    return mock;
  }

  const { sinceUnix, untilUnix } = getOrganicUnixRange(timeFilter);
  
  try {
    // 1. Fetch Page Details and dynamic Page Access Token
    const pageData = await metaGraphFetch(
      pageId,
      capiToken,
      {
        fields: 'instagram_business_account,followers_count,access_token'
      }
    );

    const pageToken = pageData.access_token;
    if (!pageToken) {
      throw new Error("Page did not return an access_token. Re-authenticate token.");
    }

    const igAccountId = pageData.instagram_business_account?.id;
    let followers = pageData.followers_count || 0;
    let reach = 0;
    let profileViews = 0;
    let engagement = 0;
    let trend: { date: string; reach: number; engagement: number }[] = [];

    if (igAccountId) {
      // IG User Info (Followers)
      const igUserData = await metaGraphFetch(
        igAccountId,
        pageToken,
        {
          fields: 'followers_count'
        }
      );
      followers += (igUserData.followers_count || 0);

      // IG Insights (Reach, Profile Views)
      const insightsData = await metaGraphFetch(
        `${igAccountId}/insights`,
        pageToken,
        {
          metric: 'impressions,reach,profile_views',
          period: 'day',
          since: sinceUnix,
          until: untilUnix
        }
      );

      if (insightsData.data) {
        const reachData = insightsData.data.find((d: any) => d.name === 'reach')?.values || [];
        const viewsData = insightsData.data.find((d: any) => d.name === 'profile_views')?.values || [];
        
        reachData.forEach((val: any) => {
          reach += val.value;
          engagement += Math.floor(val.value * 0.05);
          trend.push({
            date: val.end_time.split('T')[0],
            reach: val.value,
            engagement: Math.floor(val.value * 0.05)
          });
        });
        
        viewsData.forEach((val: any) => {
          profileViews += val.value;
        });
      }
    } else {
      // Fallback to basic Page insights using Page Access Token
      const fbInsightsData = await metaGraphFetch(
        `${pageId}/insights`,
        pageToken,
        {
          metric: 'page_post_engagements,page_daily_follows,page_views_total',
          period: 'day',
          since: sinceUnix,
          until: untilUnix
        }
      );

      if (fbInsightsData.data && fbInsightsData.data.length > 0) {
        const viewsData = fbInsightsData.data.find((d: any) => d.name === 'page_views_total')?.values || [];
        const engData = fbInsightsData.data.find((d: any) => d.name === 'page_post_engagements')?.values || [];
        const followsData = fbInsightsData.data.find((d: any) => d.name === 'page_daily_follows')?.values || [];
        
        const dailyMap: { [date: string]: { reach: number; engagement: number } } = {};
        
        viewsData.forEach((val: any) => {
          const dateStr = val.end_time.split('T')[0];
          const estReach = val.value * 12 + 100;
          dailyMap[dateStr] = { reach: estReach, engagement: 0 };
          profileViews += val.value;
          reach += estReach;
        });

        engData.forEach((val: any) => {
          const dateStr = val.end_time.split('T')[0];
          if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = { reach: 100, engagement: 0 };
          }
          dailyMap[dateStr].engagement = val.value;
          engagement += val.value;
        });

        followsData.forEach((val: any) => {
          followers += val.value;
        });

        trend = Object.keys(dailyMap).sort().map(date => ({
          date,
          reach: dailyMap[date].reach,
          engagement: dailyMap[date].engagement
        }));
      }

      if (trend.length === 0) {
        const mock = generateMockOrganicData(timeFilter);
        return {
          ...mock,
          followers: followers || mock.followers,
          error: "Kredensial valid tetapi data organik Halaman kosong/baru. Menampilkan visualisasi data simulasi."
        };
      }
    }

    return {
      configured: true,
      followers,
      reach,
      profileViews,
      engagement,
      trend
    };
  } catch (error: any) {
    console.error("Meta Organic API Fetch Error:", error);
    const mock = generateMockOrganicData(timeFilter);
    mock.error = `Gagal menarik data organik asli: ${error.message}. Menampilkan data simulasi.`;
    return mock;
  }
}
