export interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  deliveryStatus: string;
  budget: string;
  endDate: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  cpa: number;
  cpc: number;
  cpm: number;
  qualityRanking: string;
  engagementRanking: string;
  conversionRanking: string;
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
    cpa: number;
    cpc: number;
    cpm: number;
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
  reach?: number;
  views?: number;
  shares?: number;
  saved?: number;
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
  // Derived strategic metrics (computed server-side)
  engagementRate: number;
  avgReachPerPost: number;
  growthRate: number;
  bestDay: string;
  contentScore: number;
  strategicInsights: string[];
}

export interface MetaOrganicData {
  configured: boolean;
  error?: string;
  instagram: PlatformMetrics;
  facebook: PlatformMetrics;
}
