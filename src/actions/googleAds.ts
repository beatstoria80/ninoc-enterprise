"use server";

import { GoogleAdsService } from '@/services/google/GoogleAdsService';
import type { 
  GoogleAdsData, 
  GoogleAdGroup, 
  GoogleAd, 
  GoogleAdInsightsDetail 
} from '@/services/google/types';


export async function getGoogleAdsData(timeFilter: string = '28d'): Promise<GoogleAdsData> {
  const data = await GoogleAdsService.getDashboardOverview(timeFilter);
  return JSON.parse(JSON.stringify(data));
}

export async function getGoogleAdGroups(campaignId: string, timeFilter: string = '28d'): Promise<GoogleAdGroup[]> {
  const data = await GoogleAdsService.getAdGroupsByCampaign(campaignId, timeFilter);
  return JSON.parse(JSON.stringify(data));
}

export async function getGoogleAds(adGroupId: string, campaignId: string, timeFilter: string = '28d'): Promise<GoogleAd[]> {
  const data = await GoogleAdsService.getAdsByAdGroup(adGroupId, campaignId, timeFilter);
  return JSON.parse(JSON.stringify(data));
}

export async function getGoogleAdDetail(adId: string, timeFilter: string = '28d'): Promise<GoogleAdInsightsDetail | null> {
  const data = await GoogleAdsService.getAdInsightsDetail(adId, timeFilter);
  return JSON.parse(JSON.stringify(data));
}
