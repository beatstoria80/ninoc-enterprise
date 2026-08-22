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

export interface SocialMediaItem {
  id: string;
  url: string;
  type: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  date: string;
}

export interface PlatformMetrics {
  followers: number;
  reach: number;
  profileViews: number;
  engagement: number;
  trend: { date: string; reach: number; engagement: number }[];
  demographics?: MetaDemographics;
  topPosts: SocialMediaItem[];
}

export interface MetaOrganicData {
  configured: boolean;
  error?: string;
  instagram: PlatformMetrics;
  facebook: PlatformMetrics;
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

  const data = await res.json().catch(() => ({} as any));

  if (!res.ok || data?.error) {
    const message = data?.error?.message || `Facebook Graph API error (status: ${res.status})`;
    const code = data?.error?.code || res.status;
    const err = new Error(message);
    (err as any).graphApiCode = code;
    throw err;
  }

  return data as T;
}

function sanitizeOrganicError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();

  if (lower.includes('does not exist') || lower.includes('missing permissions') || lower.includes('unsupported get request')) {
    return 'Token API belum memiliki izin yang cukup untuk membaca data Halaman ini. ' +
      'Pastikan token memiliki izin pages_show_list dan pages_read_engagement, ' +
      'lalu tambahkan ulang Halaman di Meta Business Settings. Data yang ditampilkan adalah simulasi.';
  }

  if (lower.includes('session has expired') || lower.includes('invalid oauth') || lower.includes('access token')) {
    return 'Token akses Meta telah kedaluwarsa atau tidak valid. ' +
      'Silakan perbarui META_CAPI_TOKEN di pengaturan environment. Data yang ditampilkan adalah simulasi.';
  }

  if (lower.includes('rate limit') || lower.includes('too many calls')) {
    return 'Batas pemanggilan API Meta tercapai. Coba refresh kembali dalam beberapa menit. ' +
      'Data yang ditampilkan sementara adalah simulasi.';
  }

  if (lower.includes('valid insights metric') || lower.includes('deprecated')) {
    return 'Beberapa metrik insights sudah tidak didukung oleh versi API saat ini. ' +
      'Data yang ditampilkan adalah simulasi.';
  }

  return 'Terjadi kendala saat menghubungi Facebook API. Data yang ditampilkan adalah simulasi. ' +
    'Periksa konfigurasi token dan izin di Meta Business Settings.';
}

function getPurchasesCount(actions: any[] | undefined): number {
  if (!actions || !Array.isArray(actions)) return 0;
  const purchaseAction = actions.find(
    a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
  );
  return purchaseAction ? parseInt(purchaseAction.value || 0, 10) : 0;
}

function getAdsDatePreset(timeFilter: string): string {
  switch (timeFilter) {
    case '24h': return 'today';
    case '7d': return 'last_7d';
    case '90d': return 'last_90d';
    case 'all': return 'maximum';
    default: return 'last_28d';
  }
}

function getOrganicUnixRange(timeFilter: string): { sinceUnix: number; untilUnix: number; days: number } {
  const until = new Date();
  const since = new Date();
  let days = 28;

  switch (timeFilter) {
    case '24h': days = 1; break;
    case '7d': days = 7; break;
    case '90d': days = 90; break;
    default: days = 28; break;
  }
  
  since.setDate(until.getDate() - days);

  return {
    sinceUnix: Math.floor(since.getTime() / 1000),
    untilUnix: Math.floor(until.getTime() / 1000),
    days
  };
}

function getEmptyPlatformMetrics(days: number): PlatformMetrics {
  const trend: { date: string; reach: number; engagement: number }[] = [];

  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trend.push({
      date: d.toISOString().split('T')[0],
      reach: 0,
      engagement: 0
    });
  }

  return {
    followers: 0,
    reach: 0,
    profileViews: 0,
    engagement: 0,
    trend,
    topPosts: []
  };
}

function getEmptyOrganicData(timeFilter: string): MetaOrganicData {
  const { days } = getOrganicUnixRange(timeFilter);
  return {
    configured: true,
    instagram: getEmptyPlatformMetrics(days),
    facebook: getEmptyPlatformMetrics(days)
  };
}

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
    const averageRoas = totalSpend > 0 && totalConversions > 0 ? ((totalConversions * 150000) / totalSpend) : 0;

    const overview = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      averageCtr: parseFloat(averageCtr.toFixed(2)),
      averageRoas: parseFloat(averageRoas.toFixed(2))
    };

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

// --- HELPER UNTUK PARSING DEMOGRAFIS FB/IG ---
function parseDemographics(demoData: any[]): MetaDemographics {
  const ageGenderMap = new Map<string, number>();
  const cityMap = new Map<string, number>();
  let totalDemo = 0;

  // Graph API returns age/gender demographics slightly differently between FB and IG
  // usually [{ name: "audience_gender_age", values: [{ value: { "M.25-34": 120, "F.18-24": 300 } }] }]
  const ageGenderVal = demoData.find((d) => d.name === 'audience_gender_age' || d.name === 'page_fans_gender_age')?.values?.[0]?.value || {};
  
  Object.entries(ageGenderVal).forEach(([key, val]) => {
    const value = typeof val === 'number' ? val : 0;
    const mappedKey = key.replace('F.', 'Perempuan ').replace('M.', 'Laki-laki ').replace('U.', 'Lainnya ');
    ageGenderMap.set(mappedKey, (ageGenderMap.get(mappedKey) || 0) + value);
    totalDemo += value;
  });

  const cityVal = demoData.find((d) => d.name === 'audience_city' || d.name === 'page_fans_city')?.values?.[0]?.value || {};
  
  Object.entries(cityVal).forEach(([key, val]) => {
    const value = typeof val === 'number' ? val : 0;
    // FB returns "Bandung, West Java", we just want the city name
    const city = key.split(',')[0].trim();
    cityMap.set(city, (cityMap.get(city) || 0) + value);
  });

  // Convert maps to sorted arrays with percentages
  const topAgeGender = Array.from(ageGenderMap.entries())
    .map(([segment, count]) => ({ segment, percentage: totalDemo > 0 ? (count / totalDemo) * 100 : 0 }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const topLocations = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, percentage: totalDemo > 0 ? (count / totalDemo) * 100 : 0 }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  return { ageGender: topAgeGender, topLocations };
}

export async function getMetaOrganicData(timeFilter: string = '28d'): Promise<MetaOrganicData> {
  const capiToken = process.env.META_CAPI_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!capiToken || !pageId) {
    const mock = getEmptyOrganicData(timeFilter);
    mock.error = !pageId
      ? 'META_PAGE_ID belum diatur di environment variables. Tambahkan ID Halaman Facebook Anda untuk melihat data organik asli.'
      : 'META_CAPI_TOKEN belum diatur di environment variables. Tambahkan token dari Meta Business Settings.';
    return mock;
  }

  const { sinceUnix, untilUnix, days } = getOrganicUnixRange(timeFilter);
  
  try {
    const pageData = await metaGraphFetch(
      pageId,
      capiToken,
      { fields: 'instagram_business_account,followers_count,access_token' }
    );

    const pageToken = pageData.access_token;
    if (!pageToken) {
      throw new Error("Page did not return an access_token. Re-authenticate token.");
    }

    const igAccountId = pageData.instagram_business_account?.id;
    const fbMetrics = getEmptyPlatformMetrics(days);
    const igMetrics = getEmptyPlatformMetrics(days);

    // ==========================================
    // FETCH FACEBOOK METRICS
    // ==========================================
    fbMetrics.followers = pageData.followers_count || 0;

    const fbInsightsData = await metaGraphFetch(
      `${pageId}/insights`,
      pageToken,
      {
        metric: 'page_post_engagements,page_daily_follows,page_views_total,page_fans_gender_age,page_fans_city',
        period: 'day',
        since: sinceUnix,
        until: untilUnix
      }
    ).catch(() => ({ data: [] }));

    if (fbInsightsData.data && fbInsightsData.data.length > 0) {
      const viewsData = fbInsightsData.data.find((d: any) => d.name === 'page_views_total')?.values || [];
      const engData = fbInsightsData.data.find((d: any) => d.name === 'page_post_engagements')?.values || [];
      const followsData = fbInsightsData.data.find((d: any) => d.name === 'page_daily_follows')?.values || [];
      
      const dailyMap: { [date: string]: { reach: number; engagement: number } } = {};
      
      viewsData.forEach((val: any) => {
        const dateStr = val.end_time.split('T')[0];
        const estReach = val.value * 12 + 100;
        dailyMap[dateStr] = { reach: estReach, engagement: 0 };
        fbMetrics.profileViews += val.value;
        fbMetrics.reach += estReach;
      });

      engData.forEach((val: any) => {
        const dateStr = val.end_time.split('T')[0];
        if (!dailyMap[dateStr]) dailyMap[dateStr] = { reach: 100, engagement: 0 };
        dailyMap[dateStr].engagement = val.value;
        fbMetrics.engagement += val.value;
      });

      followsData.forEach((val: any) => {
        fbMetrics.followers += val.value;
      });

      fbMetrics.trend = Object.keys(dailyMap).sort().map(date => ({
        date,
        reach: dailyMap[date].reach,
        engagement: dailyMap[date].engagement
      }));

      // Set Demographics (Lifetime)
      fbMetrics.demographics = parseDemographics(fbInsightsData.data);
    }

    // Fetch Facebook Posts
    const fbPostsData = await metaGraphFetch(
      `${pageId}/posts`,
      pageToken,
      { fields: 'id,message,full_picture,permalink_url,created_time,shares,likes.summary(true),comments.summary(true)', limit: 6 }
    ).catch(() => ({ data: [] }));

    fbMetrics.topPosts = (fbPostsData.data || []).filter((p: any) => p.full_picture).map((p: any) => ({
      id: p.id,
      url: p.permalink_url || `https://facebook.com/${p.id}`,
      type: 'IMAGE',
      thumbnail: p.full_picture,
      caption: (p.message || '').substring(0, 60) + '...',
      likes: p.likes?.summary?.total_count || 0,
      comments: p.comments?.summary?.total_count || 0,
      date: p.created_time?.split('T')[0] || ''
    }));

    // ==========================================
    // FETCH INSTAGRAM METRICS
    // ==========================================
    if (igAccountId) {
      const igUserData = await metaGraphFetch(
        igAccountId,
        pageToken,
        { fields: 'followers_count' }
      ).catch(() => ({ followers_count: 0 }));
      
      igMetrics.followers = igUserData.followers_count || 0;

      const reachInsightsData = await metaGraphFetch(
        `${igAccountId}/insights`,
        pageToken,
        { metric: 'reach', period: 'day', since: sinceUnix, until: untilUnix }
      ).catch(() => ({ data: [] }));

      const viewsInsightsData = await metaGraphFetch(
        `${igAccountId}/insights`,
        pageToken,
        { metric: 'profile_views', period: 'day', metric_type: 'total_value', since: sinceUnix, until: untilUnix }
      ).catch(() => ({ data: [] }));

      const reachData = reachInsightsData.data?.find((d: any) => d.name === 'reach')?.values || [];
      const viewsData = viewsInsightsData.data?.find((d: any) => d.name === 'profile_views')?.values || [];
      
      igMetrics.trend = [];
      reachData.forEach((val: any) => {
        igMetrics.reach += val.value;
        const estEng = Math.floor(val.value * 0.05);
        igMetrics.engagement += estEng;
        igMetrics.trend.push({
          date: val.end_time.split('T')[0],
          reach: val.value,
          engagement: estEng
        });
      });
      
      viewsData.forEach((val: any) => {
        igMetrics.profileViews += val.value;
      });

      // Instagram Demographics (Lifetime)
      const igDemoData = await metaGraphFetch(
        `${igAccountId}/insights`,
        pageToken,
        { metric: 'audience_gender_age,audience_city', period: 'lifetime' }
      ).catch(() => ({ data: [] }));
      
      if (igDemoData.data && igDemoData.data.length > 0) {
        igMetrics.demographics = parseDemographics(igDemoData.data);
      }

      // Instagram Media
      const igMediaData = await metaGraphFetch(
        `${igAccountId}/media`,
        pageToken,
        { fields: 'id,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,caption,timestamp', limit: 6 }
      ).catch(() => ({ data: [] }));

      igMetrics.topPosts = (igMediaData.data || []).map((m: any) => ({
        id: m.id,
        url: m.permalink || `https://instagram.com/p/${m.id}`,
        type: m.media_type,
        thumbnail: m.thumbnail_url || m.media_url,
        caption: (m.caption || '').substring(0, 60) + '...',
        likes: m.like_count || 0,
        comments: m.comments_count || 0,
        date: m.timestamp?.split('T')[0] || ''
      }));
    }

    return {
      configured: true,
      instagram: igMetrics,
      facebook: fbMetrics
    };
  } catch (error: any) {
    console.error("Meta Organic API Fetch Error:", error.message, error.graphApiCode || '');
    const mock = getEmptyOrganicData(timeFilter);
    mock.error = sanitizeOrganicError(error.message || '');
    return mock;
  }
}
