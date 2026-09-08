import { GoogleAdsApi } from 'google-ads-api';
import type { 
  GoogleAdsData, 
  GoogleAdsCampaign, 
  GoogleAdGroup, 
  GoogleAd, 
  GoogleAdInsightsDetail 
} from './types';

export class GoogleAdsService {
  /**
   * Sanitize a Google Ads Customer ID by stripping all non-digit characters.
   * Google Ads API requires purely numeric IDs (e.g., "1234567890"), 
   * but users often copy-paste them with hyphens (e.g., "123-456-7890").
   */
  private static sanitizeCustomerId(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const cleaned = id.replace(/[^0-9]/g, '');
    return cleaned.length > 0 ? cleaned : undefined;
  }

  private static getCustomer() {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const rawCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const rawLoginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

    if (!clientId || !clientSecret || !developerToken || !refreshToken || !rawCustomerId) {
      // Log which specific vars are missing for faster debugging
      const missing = [];
      if (!clientId) missing.push('GOOGLE_ADS_CLIENT_ID');
      if (!clientSecret) missing.push('GOOGLE_ADS_CLIENT_SECRET');
      if (!developerToken) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
      if (!refreshToken) missing.push('GOOGLE_ADS_REFRESH_TOKEN');
      if (!rawCustomerId) missing.push('GOOGLE_ADS_CUSTOMER_ID');
      console.warn(`[GoogleAdsService] Tidak terkonfigurasi — env vars kosong: ${missing.join(', ')}`);
      return null;
    }

    const customerId = this.sanitizeCustomerId(rawCustomerId)!;
    const loginCustomerId = this.sanitizeCustomerId(rawLoginCustomerId);

    // CRITICAL: If accessing a client account via an MCC (Manager) account,
    // login_customer_id MUST be set. Log a warning if it's missing.
    if (!loginCustomerId) {
      console.warn(
        '[GoogleAdsService] GOOGLE_ADS_LOGIN_CUSTOMER_ID tidak di-set. ' +
        'Jika akun Google Ads Anda dikelola melalui MCC (Manager Account), ' +
        'variabel ini WAJIB diisi dengan ID Manager Account Anda.'
      );
    }

    const client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    console.log('[GoogleAdsService] Authenticating with:', {
      customer_id: customerId,
      login_customer_id: loginCustomerId,
      hasRefreshToken: !!refreshToken
    });

    return client.Customer({
      customer_id: customerId,
      login_customer_id: loginCustomerId,
      refresh_token: refreshToken,
    });
  }

  private static getDatePreset(timeFilter: string): string {
    switch (timeFilter) {
      case '24h': return 'TODAY';
      case '7d': return 'LAST_7_DAYS';
      case '28d': return 'LAST_30_DAYS';
      case '90d': return 'LAST_90_DAYS';
      case 'all': return 'ALL_TIME';
      default: return 'LAST_30_DAYS';
    }
  }

  static async getDashboardOverview(timeFilter: string = '28d'): Promise<GoogleAdsData> {
    const customer = this.getCustomer();
    
    if (!customer) {
      return {
        configured: false,
        overview: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, averageCtr: 0, averageRoas: 0, cpa: 0, cpc: 0, cpm: 0 },
        campaigns: [],
        trend: []
      };
    }

    const datePreset = this.getDatePreset(timeFilter);

    try {
      // 1. Get Campaign Level Performance
      const campaignQuery = `
        SELECT 
          campaign.id, 
          campaign.name, 
          campaign.status,
          metrics.cost_micros, 
          metrics.clicks, 
          metrics.impressions, 
          metrics.conversions,
          metrics.search_impression_share,
          campaign_budget.amount_micros
        FROM campaign 
        WHERE segments.date DURING ${datePreset}
          AND campaign.status IN ('ENABLED', 'PAUSED')
      `;

      const campaignResponse = await customer.query(campaignQuery);
      
      let totalSpend = 0;
      let totalClicks = 0;
      let totalImpressions = 0;
      let totalConversions = 0;
      const campaigns: GoogleAdsCampaign[] = [];

      if (campaignResponse && campaignResponse.length > 0) {
        campaignResponse.forEach((row: any) => {
          const spendIdr = Number(row.metrics?.cost_micros || 0) / 1000000;
          const clicks = Number(row.metrics?.clicks || 0);
          const impressions = Number(row.metrics?.impressions || 0);
          const conversions = Number(row.metrics?.conversions || 0);
          
          totalSpend += spendIdr;
          totalClicks += clicks;
          totalImpressions += impressions;
          totalConversions += conversions;

          const roas = spendIdr > 0 && conversions > 0 ? ((conversions * 150000) / spendIdr) : 0;
          const cpa = conversions > 0 ? spendIdr / conversions : 0;
          const cpc = clicks > 0 ? spendIdr / clicks : 0;
          const cpm = impressions > 0 ? (spendIdr / impressions) * 1000 : 0;
          
          let budgetStr = 'N/A';
          if (row.campaign_budget?.amount_micros) {
             budgetStr = `Rp ${(Number(row.campaign_budget.amount_micros) / 1000000).toLocaleString('id-ID')} / harian`;
          }

          const statusMap: Record<string, string> = {
            '2': 'ENABLED',
            '3': 'PAUSED',
            '4': 'REMOVED'
          };
          const rawStatus = String(row.campaign?.status || 'UNKNOWN');
          const mappedStatus = statusMap[rawStatus] || rawStatus;

          campaigns.push({
            id: row.campaign?.id?.toString() || 'unknown',
            name: String(row.campaign?.name || 'Unnamed Campaign'),
            status: mappedStatus as any,
            deliveryStatus: mappedStatus,
            budget: String(budgetStr),
            endDate: 'Sedang berjalan',
            spend: spendIdr,
            clicks,
            impressions,
            conversions,
            roas: parseFloat(roas.toFixed(2)),
            cpa,
            cpc,
            cpm,
            searchImpressionShare: String(row.metrics?.search_impression_share || '—')
          });
        });
      }

      // 2. Get Trend Data
      const trendQuery = `
        SELECT 
          segments.date,
          metrics.cost_micros,
          metrics.conversions
        FROM customer
        WHERE segments.date DURING ${datePreset}
        ORDER BY segments.date ASC
      `;
      
      const trendResponse = await customer.query(trendQuery);
      
      const rawTrend = (trendResponse || []).reduce((acc: any, row: any) => {
        const d = String(row.segments?.date || '');
        if (d) {
          acc[d] = {
            spend: Number(row.metrics?.cost_micros || 0) / 1000000,
            conversions: Number(row.metrics?.conversions || 0)
          };
        }
        return acc;
      }, {});

      const trend = [];
      const daysCount = timeFilter === '7d' ? 7 : timeFilter === '28d' ? 30 : timeFilter === '90d' ? 90 : timeFilter === '24h' ? 1 : 30;
      
      // Generate continuous chronological dates
      const today = new Date();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        trend.push({
          date: dateStr,
          spend: rawTrend[dateStr]?.spend || 0,
          conversions: rawTrend[dateStr]?.conversions || 0
        });
      }

      const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averageRoas = totalSpend > 0 && totalConversions > 0 ? ((totalConversions * 150000) / totalSpend) : 0;
      const overallCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const overallCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const overallCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

      return {
        configured: true,
        overview: {
          totalSpend,
          totalImpressions,
          totalClicks,
          totalConversions,
          averageCtr: parseFloat(averageCtr.toFixed(2)),
          averageRoas: parseFloat(averageRoas.toFixed(2)),
          cpa: overallCpa,
          cpc: overallCpc,
          cpm: overallCpm
        },
        campaigns,
        trend
      };
    } catch (error: any) {
      let errorMsg = error?.message || '';
      if (!errorMsg && typeof error === 'object') {
        if (error.errors && error.errors[0]) {
           errorMsg = error.errors[0].message || JSON.stringify(error.errors);
        } else if (error.response?.data) {
           errorMsg = JSON.stringify(error.response.data);
        } else {
           errorMsg = JSON.stringify(error);
        }
      }
      if (!errorMsg) errorMsg = String(error);

      console.error("Google Ads API Fetch Error:", errorMsg);
      
      return {
        configured: true,
        error: `Gagal menarik data API Google Ads: ${errorMsg}`,
        overview: { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, averageCtr: 0, averageRoas: 0, cpa: 0, cpc: 0, cpm: 0 },
        campaigns: [],
        trend: []
      };
    }
  }

  static async getAdGroupsByCampaign(campaignId: string, timeFilter: string = '28d'): Promise<GoogleAdGroup[]> {
    const customer = this.getCustomer();
    if (!customer) return [];
    
    const datePreset = this.getDatePreset(timeFilter);
    try {
      const query = `
        SELECT 
          ad_group.id,
          ad_group.name,
          ad_group.status,
          metrics.cost_micros,
          metrics.clicks,
          metrics.impressions,
          metrics.conversions,
          metrics.search_impression_share
        FROM ad_group
        WHERE campaign.id = ${campaignId} 
          AND segments.date DURING ${datePreset}
          AND ad_group.status IN ('ENABLED', 'PAUSED')
      `;
      const response = await customer.query(query);

      return (response || []).map((row: any) => {
        const spendIdr = Number(row.metrics?.cost_micros || 0) / 1000000;
        const clicks = Number(row.metrics?.clicks || 0);
        const impressions = Number(row.metrics?.impressions || 0);
        const conversions = Number(row.metrics?.conversions || 0);
        const roas = spendIdr > 0 && conversions > 0 ? ((conversions * 150000) / spendIdr) : 0;
        const cpa = conversions > 0 ? spendIdr / conversions : 0;

        return {
          id: row.ad_group?.id?.toString() || 'unknown',
          campaignId,
          name: row.ad_group?.name || 'Unnamed Ad Group',
          status: String(row.ad_group?.status || 'UNKNOWN') as any,
          deliveryStatus: String(row.ad_group?.status || 'UNKNOWN'),
          budget: 'Mengikuti Kampanye',
          endDate: '—',
          spend: spendIdr,
          impressions,
          clicks,
          conversions,
          roas: parseFloat(roas.toFixed(2)),
          cpa,
          cpc: clicks > 0 ? spendIdr / clicks : 0,
          cpm: impressions > 0 ? (spendIdr / impressions) * 1000 : 0,
          searchImpressionShare: row.metrics?.search_impression_share || '—'
        };
      });
    } catch (error: any) {
      console.error("Google Ads API Fetch Error in getAdGroupsByCampaign:", error);
      return [];
    }
  }

  static async getAdsByAdGroup(adGroupId: string, campaignId: string, timeFilter: string = '28d'): Promise<GoogleAd[]> {
    const customer = this.getCustomer();
    if (!customer) return [];
    
    const datePreset = this.getDatePreset(timeFilter);
    try {
      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ad_group_ad.status,
          metrics.cost_micros,
          metrics.clicks,
          metrics.impressions,
          metrics.conversions
        FROM ad_group_ad
        WHERE ad_group.id = ${adGroupId} 
          AND segments.date DURING ${datePreset}
          AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
      `;
      const response = await customer.query(query);

      return (response || []).map((row: any) => {
        const spendIdr = Number(row.metrics?.cost_micros || 0) / 1000000;
        const clicks = Number(row.metrics?.clicks || 0);
        const impressions = Number(row.metrics?.impressions || 0);
        const conversions = Number(row.metrics?.conversions || 0);
        const roas = spendIdr > 0 && conversions > 0 ? ((conversions * 150000) / spendIdr) : 0;
        const cpa = conversions > 0 ? spendIdr / conversions : 0;

        return {
          id: row.ad_group_ad?.ad?.id?.toString() || 'unknown',
          adGroupId,
          campaignId,
          name: row.ad_group_ad?.ad?.name || 'Unnamed Ad',
          status: String(row.ad_group_ad?.status || 'UNKNOWN') as any,
          deliveryStatus: String(row.ad_group_ad?.status || 'UNKNOWN'),
          budget: 'Mengikuti Grup Iklan',
          endDate: '—',
          spend: spendIdr,
          impressions,
          clicks,
          conversions,
          roas: parseFloat(roas.toFixed(2)),
          cpa,
          cpc: clicks > 0 ? spendIdr / clicks : 0,
          cpm: impressions > 0 ? (spendIdr / impressions) * 1000 : 0,
          searchImpressionShare: '—'
        };
      });
    } catch (error: any) {
      console.error("Google Ads API Fetch Error in getAdsByAdGroup:", error);
      return [];
    }
  }

  static async getAdInsightsDetail(adId: string, timeFilter: string = '28d'): Promise<GoogleAdInsightsDetail | null> {
    const customer = this.getCustomer();
    if (!customer) return null;
    
    const datePreset = this.getDatePreset(timeFilter);
    try {
      // 1. Get Ad level overview
      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ad_group_ad.ad.final_urls,
          ad_group_ad.ad.type,
          metrics.cost_micros,
          metrics.clicks,
          metrics.impressions,
          metrics.conversions,
          metrics.ctr
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${adId}
          AND segments.date DURING ${datePreset}
      `;
      const response = await customer.query(query);
      if (!response || response.length === 0) return null;
      
      const row = response[0];
      const spendIdr = Number(row.metrics?.cost_micros || 0) / 1000000;
      const clicks = Number(row.metrics?.clicks || 0);
      const impressions = Number(row.metrics?.impressions || 0);
      const conversions = Number(row.metrics?.conversions || 0);
      const ctr = Number(row.metrics?.ctr || 0) * 100;
      const roas = spendIdr > 0 && conversions > 0 ? ((conversions * 150000) / spendIdr) : 0;
      const cpa = conversions > 0 ? spendIdr / conversions : 0;
      const cpm = impressions > 0 ? (spendIdr / impressions) * 1000 : 0;
      
      const finalUrl = row.ad_group_ad?.ad?.final_urls?.[0] || 'NINOC.STORE';
      
      // 2. Get Trend
      const trendQuery = `
        SELECT 
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions
        FROM ad_group_ad
        WHERE ad_group_ad.ad.id = ${adId}
          AND segments.date DURING ${datePreset}
        ORDER BY segments.date ASC
      `;
      const trendResponse = await customer.query(trendQuery);
      const trend = (trendResponse || []).map((t: any) => ({
        date: t.segments?.date || '',
        impressions: Number(t.metrics?.impressions || 0),
        clicks: Number(t.metrics?.clicks || 0),
        conversions: Number(t.metrics?.conversions || 0)
      }));

      return {
        id: adId,
        name: row.ad_group_ad?.ad?.name || 'Google Ad',
        spend: spendIdr,
        impressions,
        clicks,
        conversions,
        cpa,
        cpm,
        roas,
        publishedDate: '—', // Hard to get from GAQL without creating very complex queries
        creativeThumbnail: '', // Mocked or left empty
        creativeBody: String(row.ad_group_ad?.ad?.type || 'Ad'),
        creativeTitle: row.ad_group_ad?.ad?.name || 'Google Ad',
        creativeFinalUrl: finalUrl,
        dailyBudget: 0,
        ctr,
        trend,
        demographics: [], // Can implement via age_range_view if needed
        networks: [],
        devices: []
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
