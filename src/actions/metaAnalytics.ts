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

  // If no Pixel ID or CAPI token, we consider it unconfigured
  if (!pixelId || !capiToken) {
    return {
      configured: false,
      overview: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, averageCtr: 0, averageRoas: 0 },
      campaigns: [],
      demographics: { ageGender: [], topLocations: [] },
      trend: []
    };
  }

  // MOCK DATA GENERATION (Since we don't have real Ad Account ID yet)
  // In the future, this will be replaced with actual Facebook Graph API calls
  
  // Base multiplier based on time filter
  let multiplier = 1;
  if (timeFilter === '7d') multiplier = 0.25;
  if (timeFilter === '24h') multiplier = 0.05;
  if (timeFilter === '90d') multiplier = 3;
  if (timeFilter === 'all') multiplier = 12;

  const mockOverview = {
    totalSpend: Math.floor(2500000 * multiplier),
    totalImpressions: Math.floor(150000 * multiplier),
    totalClicks: Math.floor(3500 * multiplier),
    totalConversions: Math.floor(125 * multiplier),
    averageCtr: 2.33,
    averageRoas: 4.2
  };

  const mockCampaigns: MetaCampaign[] = [
    {
      id: '238519283718',
      name: 'Q3_Advantage+ Shopping_All Products',
      status: 'ACTIVE',
      spend: Math.floor(1200000 * multiplier),
      impressions: Math.floor(80000 * multiplier),
      clicks: Math.floor(1800 * multiplier),
      conversions: Math.floor(75 * multiplier),
      roas: 4.8
    },
    {
      id: '238519283719',
      name: 'Retargeting_Add To Cart_Last 7D',
      status: 'ACTIVE',
      spend: Math.floor(500000 * multiplier),
      impressions: Math.floor(30000 * multiplier),
      clicks: Math.floor(900 * multiplier),
      conversions: Math.floor(30 * multiplier),
      roas: 5.2
    },
    {
      id: '238519283720',
      name: 'Prospecting_Lookalike_1%_ID',
      status: 'PAUSED',
      spend: Math.floor(800000 * multiplier),
      impressions: Math.floor(40000 * multiplier),
      clicks: Math.floor(800 * multiplier),
      conversions: Math.floor(20 * multiplier),
      roas: 2.1
    }
  ];

  const mockDemographics: MetaDemographics = {
    ageGender: [
      { segment: '18-24 (F)', percentage: 35 },
      { segment: '25-34 (F)', percentage: 40 },
      { segment: '18-24 (M)', percentage: 10 },
      { segment: '25-34 (M)', percentage: 10 },
      { segment: '35-44', percentage: 5 }
    ],
    topLocations: [
      { city: 'Jakarta', percentage: 45 },
      { city: 'Bandung', percentage: 20 },
      { city: 'Surabaya', percentage: 15 },
      { city: 'Medan', percentage: 10 },
      { city: 'Other', percentage: 10 }
    ]
  };

  // Generate mock trend data for the last 7 days
  const mockTrend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      spend: Math.floor(Math.random() * 200000) + 100000,
      conversions: Math.floor(Math.random() * 20) + 5
    };
  });

  return {
    configured: true,
    error: adAccountId ? undefined : "Ad Account ID (META_AD_ACCOUNT_ID) belum diatur. Menampilkan data simulasi (mock data).",
    overview: mockOverview,
    campaigns: mockCampaigns,
    demographics: mockDemographics,
    trend: mockTrend
  };
}
