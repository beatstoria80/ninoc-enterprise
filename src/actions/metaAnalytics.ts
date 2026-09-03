"use server";

import { MetaAnalyticsService } from '@/services/meta/MetaAnalyticsService';
import type { MetaAnalyticsData, MetaOrganicData } from '@/services/meta/types';

// Export types so that other files importing from actions/metaAnalytics still work
export type { 
  MetaCampaign, 
  MetaDemographics, 
  MetaAnalyticsData, 
  SocialMediaItem, 
  PlatformMetrics, 
  MetaOrganicData 
} from '@/services/meta/types';

/**
 * Controller Action for Ads Dashboard.
 * Delegates the heavy lifting and business logic to MetaAnalyticsService.
 */
export async function getMetaAnalyticsData(timeFilter: string = '28d'): Promise<MetaAnalyticsData> {
  return await MetaAnalyticsService.getDashboardOverview(timeFilter);
}

/**
 * Controller Action for Organic Dashboard.
 * Delegates the heavy lifting and business logic to MetaAnalyticsService.
 */
export async function getMetaOrganicData(timeFilter: string = '28d'): Promise<MetaOrganicData> {
  return await MetaAnalyticsService.getOrganicDashboard(timeFilter);
}
export async function getAdSetsByCampaign(campaignId: string, timeFilter: string = '28d') {
  return await MetaAnalyticsService.getAdSetsByCampaign(campaignId, timeFilter);
}

export async function getAdsByAdSet(adSetId: string, campaignId: string, timeFilter: string = '28d') {
  return await MetaAnalyticsService.getAdsByAdSet(adSetId, campaignId, timeFilter);
}

export async function getAdInsightsDetail(adId: string, timeFilter: string = '28d') {
  return await MetaAnalyticsService.getAdInsightsDetail(adId, timeFilter);
}
