"use server";

import { createClient } from "@supabase/supabase-js";

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

/**
 * Fetch Meta Analytics Data (Facebook/Instagram Ads)
 * Currently uses mock data until a valid Ad Account ID is provided.
 */
export async function getMetaAnalyticsData(timeFilter: string = '28d'): Promise<MetaAnalyticsData> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const capiToken = process.env.META_CAPI_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID; // We don't have this yet

  // If no Ad Account ID or CAPI token, we consider it unconfigured
  if (!capiToken || !adAccountId) {
    return {
      configured: false,
      overview: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, averageCtr: 0, averageRoas: 0 },
      campaigns: [],
      demographics: { ageGender: [], topLocations: [] },
      trend: []
    };
  }

  // Format the Ad Account ID (must start with 'act_')
  const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

  // Map time filter to Meta date_preset
  let datePreset = 'last_28d';
  if (timeFilter === '7d') datePreset = 'last_7d';
  if (timeFilter === '24h') datePreset = 'today';
  if (timeFilter === '90d') datePreset = 'last_90d';
  if (timeFilter === 'all') datePreset = 'maximum';

  try {
    const graphApiVersion = 'v19.0';
    const baseUrl = `https://graph.facebook.com/${graphApiVersion}/${formattedAdAccountId}`;

    // 1. Fetch Overview Insights
    const overviewUrl = `${baseUrl}/insights?access_token=${capiToken}&date_preset=${datePreset}&fields=spend,impressions,clicks,actions`;
    const overviewRes = await fetch(overviewUrl, { next: { revalidate: 300 } });
    const overviewData = await overviewRes.json();

    if (overviewData.error) {
      throw new Error(overviewData.error.message || 'Failed to fetch overview data');
    }

    const insights = overviewData.data && overviewData.data.length > 0 ? overviewData.data[0] : null;
    
    // Helper to extract purchase conversions
    const getPurchases = (actions: any[]) => {
      if (!actions || !Array.isArray(actions)) return 0;
      const purchaseAction = actions.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
      return purchaseAction ? parseInt(purchaseAction.value) : 0;
    };

    const totalSpend = insights ? parseFloat(insights.spend || 0) : 0;
    const totalImpressions = insights ? parseInt(insights.impressions || 0) : 0;
    const totalClicks = insights ? parseInt(insights.clicks || 0) : 0;
    const totalConversions = insights ? getPurchases(insights.actions) : 0;
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    // For ROAS, we need conversion values. If not available in simple insights, fallback to 0 or estimate.
    // In production, ensure `action_values` is queried and parsed.
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
    const campaignsUrl = `${baseUrl}/campaigns?access_token=${capiToken}&date_preset=${datePreset}&fields=id,name,status,insights{spend,impressions,clicks,actions}`;
    const campaignsRes = await fetch(campaignsUrl, { next: { revalidate: 300 } });
    const campaignsData = await campaignsRes.json();

    const campaigns: MetaCampaign[] = (campaignsData.data || []).map((camp: any) => {
      const cInsights = camp.insights?.data?.[0];
      const cSpend = cInsights ? parseFloat(cInsights.spend || 0) : 0;
      const cConversions = cInsights ? getPurchases(cInsights.actions) : 0;
      const cRoas = cSpend > 0 && cConversions > 0 ? ((cConversions * 150000) / cSpend) : 0;

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status as 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
        spend: cSpend,
        impressions: cInsights ? parseInt(cInsights.impressions || 0) : 0,
        clicks: cInsights ? parseInt(cInsights.clicks || 0) : 0,
        conversions: cConversions,
        roas: parseFloat(cRoas.toFixed(2))
      };
    });

    // 3. Fetch Trend Data (Time Increment)
    const trendUrl = `${baseUrl}/insights?access_token=${capiToken}&date_preset=${datePreset}&time_increment=1&fields=date_start,spend,actions`;
    const trendRes = await fetch(trendUrl, { next: { revalidate: 300 } });
    const trendData = await trendRes.json();
    
    const trend = (trendData.data || []).map((t: any) => ({
      date: t.date_start,
      spend: parseFloat(t.spend || 0),
      conversions: getPurchases(t.actions)
    }));
    
    return {
      configured: true,
      overview,
      campaigns,
      demographics: { ageGender: [], topLocations: [] }, // Demographics require additional breakdown queries
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

export interface MetaOrganicData {
  configured: boolean;
  error?: string;
  followers: number;
  reach: number;
  profileViews: number;
  engagement: number;
  trend: { date: string; reach: number; engagement: number }[];
}

/**
 * Fetch Meta Organic Analytics Data (Facebook Page / Instagram Profile)
 */
export async function getMetaOrganicData(timeFilter: string = '28d'): Promise<MetaOrganicData> {
  const capiToken = process.env.META_CAPI_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!capiToken || !pageId) {
    return {
      configured: false,
      followers: 0, reach: 0, profileViews: 0, engagement: 0, trend: []
    };
  }

  let since = new Date();
  since.setDate(since.getDate() - 28);
  if (timeFilter === '7d') since.setDate(new Date().getDate() - 7);
  if (timeFilter === '24h') since.setDate(new Date().getDate() - 1);
  if (timeFilter === '90d') since.setDate(new Date().getDate() - 90);
  
  const sinceUnix = Math.floor(since.getTime() / 1000);
  
  try {
    const graphApiVersion = 'v19.0';
    
    // Attempt to get Instagram Account ID linked to the Page
    const pageUrl = `https://graph.facebook.com/${graphApiVersion}/${pageId}?fields=instagram_business_account,followers_count&access_token=${capiToken}`;
    const pageRes = await fetch(pageUrl, { next: { revalidate: 300 } });
    const pageData = await pageRes.json();
    
    if (pageData.error) {
      throw new Error(pageData.error.message || 'Failed to fetch Page details. Make sure token has pages_read_engagement');
    }

    const igAccountId = pageData.instagram_business_account?.id;
    let followers = pageData.followers_count || 0;
    let reach = 0;
    let profileViews = 0;
    let engagement = 0;
    let trend: { date: string; reach: number; engagement: number }[] = [];

    if (igAccountId) {
      // IG User Info (Followers)
      const igUserUrl = `https://graph.facebook.com/${graphApiVersion}/${igAccountId}?fields=followers_count&access_token=${capiToken}`;
      const igUserRes = await fetch(igUserUrl, { next: { revalidate: 300 } });
      const igUserData = await igUserRes.json();
      if (!igUserData.error) {
        followers += (igUserData.followers_count || 0);
      }

      // IG Insights (Reach, Profile Views)
      const insightsUrl = `https://graph.facebook.com/${graphApiVersion}/${igAccountId}/insights?metric=impressions,reach,profile_views&period=day&since=${sinceUnix}&access_token=${capiToken}`;
      const insightsRes = await fetch(insightsUrl, { next: { revalidate: 300 } });
      const insightsData = await insightsRes.json();

      if (!insightsData.error && insightsData.data) {
        const reachData = insightsData.data.find((d: any) => d.name === 'reach')?.values || [];
        const viewsData = insightsData.data.find((d: any) => d.name === 'profile_views')?.values || [];
        
        reachData.forEach((val: any, index: number) => {
          reach += val.value;
          engagement += Math.floor(val.value * 0.05); // Derived estimation for simplified organic view
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
      // Fallback to basic Page insights if no IG connected
      const fbInsightsUrl = `https://graph.facebook.com/${graphApiVersion}/${pageId}/insights?metric=page_impressions_unique,page_engaged_users,page_views_total&period=day&since=${sinceUnix}&access_token=${capiToken}`;
      const fbInsightsRes = await fetch(fbInsightsUrl, { next: { revalidate: 300 } });
      const fbInsightsData = await fbInsightsRes.json();
      
      if (!fbInsightsData.error && fbInsightsData.data) {
        const reachData = fbInsightsData.data.find((d: any) => d.name === 'page_impressions_unique')?.values || [];
        const viewsData = fbInsightsData.data.find((d: any) => d.name === 'page_views_total')?.values || [];
        const engData = fbInsightsData.data.find((d: any) => d.name === 'page_engaged_users')?.values || [];
        
        reachData.forEach((val: any, index: number) => {
          reach += val.value;
          const engVal = engData[index]?.value || 0;
          engagement += engVal;
          trend.push({
            date: val.end_time.split('T')[0],
            reach: val.value,
            engagement: engVal
          });
        });
        
        viewsData.forEach((val: any) => {
          profileViews += val.value;
        });
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
    return {
      configured: true,
      error: `Failed to fetch organic data: ${error.message}`,
      followers: 0, reach: 0, profileViews: 0, engagement: 0, trend: []
    };
  }
}
