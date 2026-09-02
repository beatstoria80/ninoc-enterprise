import { SupabaseClient } from '@supabase/supabase-js';

export interface VoucherDomainModel {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  is_active: boolean;
  valid_until?: string | null;
  max_usage?: number | null;
  usage_count?: number | null;
  min_order_amount?: number | null;
  max_discount?: number | null;
}

export class VoucherRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async getActiveVoucherByCode(code: string): Promise<VoucherDomainModel | null> {
    const { data, error } = await this.supabase
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    return data as VoucherDomainModel;
  }
}
