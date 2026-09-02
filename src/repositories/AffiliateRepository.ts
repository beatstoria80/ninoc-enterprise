import { SupabaseClient } from '@supabase/supabase-js';

export interface AffiliateDomainModel {
  id: string;
  code: string;
  user_id?: string | null;
  status: 'active' | 'inactive';
  customer_discount_type?: 'percentage' | 'fixed_amount' | null;
  customer_discount_value?: number | null;
}

export class AffiliateRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async getActiveAffiliateByCode(code: string): Promise<AffiliateDomainModel | null> {
    const { data, error } = await this.supabase
      .from('affiliates')
      .select('id, user_id, code, customer_discount_type, customer_discount_value, status')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) return null;
    return data as AffiliateDomainModel;
  }
}
