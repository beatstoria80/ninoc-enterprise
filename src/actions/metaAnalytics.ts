"use server";

import { MetaAnalyticsService } from '@/services/meta/MetaAnalyticsService';
import type { MetaAnalyticsData, MetaOrganicData } from '@/services/meta/types';


/**
 * Controller Action for Ads Dashboard.
 * Delegates the heavy lifting and business logic to MetaAnalyticsService.
 */
export async function getMetaAnalyticsData(timeFilter: string = '28d'): Promise<MetaAnalyticsData> {
  const data = await MetaAnalyticsService.getDashboardOverview(timeFilter);
  return JSON.parse(JSON.stringify(data));
}

/**
 * Controller Action for Organic Dashboard.
 * Delegates the heavy lifting and business logic to MetaAnalyticsService.
 */
export async function getMetaOrganicData(timeFilter: string = '28d'): Promise<MetaOrganicData> {
  const data = await MetaAnalyticsService.getOrganicDashboard(timeFilter);
  return JSON.parse(JSON.stringify(data));
}

export async function getAdSetsByCampaign(campaignId: string, timeFilter: string = '28d') {
  const data = await MetaAnalyticsService.getAdSetsByCampaign(campaignId, timeFilter);
  return JSON.parse(JSON.stringify(data));
}

export async function getAdsByAdSet(adSetId: string, campaignId: string, timeFilter: string = '28d') {
  const data = await MetaAnalyticsService.getAdsByAdSet(adSetId, campaignId, timeFilter);
  return JSON.parse(JSON.stringify(data));
}

export async function getCampaignTrendAction(campaignId: string, timeFilter: string = '28d') {
  const data = await MetaAnalyticsService.getCampaignTrend(campaignId, timeFilter);
  return JSON.parse(JSON.stringify(data));
}

export async function getAdInsightsDetail(adId: string, timeFilter: string = '28d') {
  const data = await MetaAnalyticsService.getAdInsightsDetail(adId, timeFilter);
  return JSON.parse(JSON.stringify(data));
}
