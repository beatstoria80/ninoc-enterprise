"use server";

import { GoogleAdsApi } from 'google-ads-api';

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export interface GoogleAdsData {
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  campaigns: GoogleAdsCampaign[];
}

export async function getGoogleAdsData(): Promise<GoogleAdsData> {
  const fallback: GoogleAdsData = { totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, campaigns: [] };
  
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
    console.warn('Google Ads credentials are not fully set. Returning empty data.');
    return fallback;
  }

  try {
    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    });

    // Query campaign level performance
    const query = `
      SELECT 
        campaign.id, 
        campaign.name, 
        metrics.cost_micros, 
        metrics.clicks, 
        metrics.impressions, 
        metrics.conversions 
      FROM campaign 
      WHERE segments.date DURING THIS_MONTH 
        AND campaign.status IN ('ENABLED', 'PAUSED')
    `;

    const response = await customer.query(query);
    
    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalConversions = 0;
    const campaigns: GoogleAdsCampaign[] = [];

    if (response && response.length > 0) {
      response.forEach((row: any) => {
        const spendIdr = Number(row.metrics?.cost_micros || 0) / 1000000;
        const clicks = Number(row.metrics?.clicks || 0);
        const impressions = Number(row.metrics?.impressions || 0);
        const conversions = Number(row.metrics?.conversions || 0);

        totalSpend += spendIdr;
        totalClicks += clicks;
        totalImpressions += impressions;
        totalConversions += conversions;

        campaigns.push({
          id: row.campaign?.id?.toString() || 'unknown',
          name: row.campaign?.name || 'Unnamed Campaign',
          spend: spendIdr,
          clicks,
          impressions,
          conversions
        });
      });
    }

    return {
      totalSpend,
      totalClicks,
      totalImpressions,
      totalConversions,
      campaigns
    };
  } catch (error) {
    console.error('Failed to fetch Ad Spend from Google Ads API:', error);
    return fallback;
  }
}
