import { metaGraphFetch } from './MetaGraphAPI';

export class MetaGraphAPIClient {
  static getCapiToken(): string | undefined {
    return process.env.META_CAPI_TOKEN;
  }

  static getAdAccountId(): string | undefined {
    return process.env.META_AD_ACCOUNT_ID;
  }

  static getFormattedAdAccountId(): string | undefined {
    const adAccountId = this.getAdAccountId();
    if (!adAccountId) return undefined;
    return adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  }

  static async fetch(endpoint: string, params: Record<string, any> = {}) {
    const token = this.getCapiToken();
    if (!token) throw new Error('META_CAPI_TOKEN is not configured');
    return await metaGraphFetch(endpoint, token, params);
  }

  static async fetchAdAccount(endpoint: string, params: Record<string, any> = {}) {
    const accountId = this.getFormattedAdAccountId();
    if (!accountId) throw new Error('META_AD_ACCOUNT_ID is not configured');
    return await this.fetch(`${accountId}/${endpoint}`, params);
  }
}
