export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED' | 'UNKNOWN';
  deliveryStatus: string;
  budget: string;
  endDate: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  cpa: number;
  cpc: number;
  cpm: number;
  searchImpressionShare: string;
}

export interface GoogleAdGroup extends GoogleAdsCampaign {
  campaignId: string;
}

export interface GoogleAd extends GoogleAdsCampaign {
  adGroupId: string;
  campaignId: string;
}

export interface GoogleAdInsightsDetail {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  cpm: number;
  roas: number;
  
  publishedDate: string;
  creativeThumbnail: string;
  creativeBody: string;
  creativeTitle?: string;
  creativeFinalUrl?: string;
  dailyBudget: number;
  
  ctr: number;
  
  trend: { date: string; impressions: number; clicks: number; conversions: number }[];
  
  demographics: { age: string; gender: string; value: number }[];
  networks: { networkType: string; value: number }[];
  devices: { device: string; value: number }[];
}

export interface GoogleAdsData {
  configured: boolean;
  error?: string;
  overview: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageCtr: number;
    averageRoas: number;
    cpa: number;
    cpc: number;
    cpm: number;
  };
  campaigns: GoogleAdsCampaign[];
  trend: { date: string; spend: number; conversions: number; campaignId?: string }[];
}
