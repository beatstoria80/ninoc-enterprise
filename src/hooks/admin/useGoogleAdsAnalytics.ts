import React from 'react';
import type { GoogleAdsData } from '@/services/google/types';

export function useGoogleAdsAnalytics(
  data: GoogleAdsData, 
  selectedCampaignIds: Set<string>, 
  timeFilter: string
) {
  const filteredCampaigns = React.useMemo(() => {
    return data.campaigns.filter(c => selectedCampaignIds.has(c.id));
  }, [data.campaigns, selectedCampaignIds]);

  const dynamicOverview = React.useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    // Hardcoding expected AOV here for frontend estimation, could also be passed via context or env
    const averageRoas = totalSpend > 0 && totalConversions > 0 ? ((totalConversions * 150000) / totalSpend) : 0;

    return {
      totalSpend,
      totalConversions,
      totalClicks,
      totalImpressions,
      cpa,
      cpc,
      cpm,
      averageCtr,
      averageRoas
    };
  }, [filteredCampaigns]);

  const dynamicTrend = React.useMemo(() => {
    const filteredPoints = data.trend.filter(t => selectedCampaignIds.has(t.campaignId || ''));
    
    const aggregated = filteredPoints.reduce((acc, t) => {
      if (!acc[t.date]) acc[t.date] = { spend: 0, conversions: 0, clicks: 0, impressions: 0 };
      acc[t.date].spend += t.spend;
      acc[t.date].conversions += t.conversions;
      acc[t.date].clicks += t.clicks || 0;
      acc[t.date].impressions += t.impressions || 0;
      return acc;
    }, {} as Record<string, { spend: number; conversions: number; clicks: number; impressions: number }>);

    const result = [];
    const daysCount = timeFilter === '7d' ? 7 : timeFilter === '28d' ? 30 : timeFilter === '90d' ? 90 : timeFilter === '24h' ? 1 : 30;
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayData = aggregated[dateStr] || { spend: 0, conversions: 0, clicks: 0, impressions: 0 };
      result.push({
        date: dateStr,
        spend: dayData.spend,
        conversions: dayData.conversions,
        clicks: dayData.clicks,
        impressions: dayData.impressions,
        ctr: dayData.impressions > 0 ? (dayData.clicks / dayData.impressions) * 100 : 0
      });
    }
    return result;
  }, [data.trend, selectedCampaignIds, timeFilter]);

  return {
    filteredCampaigns,
    dynamicOverview,
    dynamicTrend
  };
}
