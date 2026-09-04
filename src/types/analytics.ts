export interface WebAnalyticsData {
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
}
