"use server";

import { GoogleAdsService } from '@/services/google/GoogleAdsService';
import type { 
  GoogleAdsData, 
  GoogleAdGroup, 
  GoogleAd, 
  GoogleAdInsightsDetail 
} from '@/services/google/types';

export type { GoogleAdsData, GoogleAdGroup, GoogleAd, GoogleAdInsightsDetail };
export type { GoogleAdsCampaign } from '@/services/google/types';

export async function getGoogleAdsData(timeFilter: string = '28d'): Promise<GoogleAdsData> {
  return GoogleAdsService.getDashboardOverview(timeFilter);
}

export async function getGoogleAdGroups(campaignId: string, timeFilter: string = '28d'): Promise<GoogleAdGroup[]> {
  return GoogleAdsService.getAdGroupsByCampaign(campaignId, timeFilter);
}

export async function getGoogleAds(adGroupId: string, campaignId: string, timeFilter: string = '28d'): Promise<GoogleAd[]> {
  return GoogleAdsService.getAdsByAdGroup(adGroupId, campaignId, timeFilter);
}

export async function getGoogleAdDetail(adId: string, timeFilter: string = '28d'): Promise<GoogleAdInsightsDetail | null> {
  return GoogleAdsService.getAdInsightsDetail(adId, timeFilter);
}
