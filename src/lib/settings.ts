import { supabase } from './supabase';

export interface DecorationSettings {
  storeName: string;
  tagline: string;
  accentColor: string;
  heroBannerUrl: string;
}

export async function getDecorationSettings(): Promise<DecorationSettings> {
  const { data, error } = await supabase
    .from('atelier_settings')
    .select('value')
    .eq('key', 'decoration')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[settings] failed to fetch decoration settings:', error);
  }

  if (data?.value) {
    return data.value as DecorationSettings;
  }

  return {
    storeName: 'NINOC',
    tagline: 'Multidimensional Creative House & Lifestyle Ecosystem',
    accentColor: '#E8527A',
    heroBannerUrl: '',
  };
}

// ============================================================
// BITESHIP ACTIVATION SETTINGS
// ============================================================
export interface BiteshipActivationSettings {
  api_key_name: string;
  activated_couriers: string[];     // ['jne', 'jnt', 'sicepat', ...]
  test_order_delivered: string;      // order_id with status 'delivered'
  test_order_cancelled: string;      // order_id with status 'cancelled'
  supports_price_change: boolean;
  supports_resi_change: boolean;
  has_insurance: boolean;
  has_cod: boolean;
  uses_own_resi: boolean;
}

export async function getBiteshipActivationSettings(): Promise<BiteshipActivationSettings> {
  const { data, error } = await supabase
    .from('atelier_settings')
    .select('value')
    .eq('key', 'biteship_activation')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[settings] failed to fetch biteship activation:', error);
  }

  if (data?.value) {
    return data.value as BiteshipActivationSettings;
  }

  return {
    api_key_name: 'API_webhook_ninoc',
    activated_couriers: ['jne', 'jnt', 'sicepat'],
    test_order_delivered: '',
    test_order_cancelled: '',
    supports_price_change: false,
    supports_resi_change: false,
    has_insurance: false,
    has_cod: false,
    uses_own_resi: false,
  };
}

export async function upsertBiteshipActivationSettings(
  patch: Partial<BiteshipActivationSettings>
): Promise<void> {
  const existing = await getBiteshipActivationSettings();
  const merged: BiteshipActivationSettings = { ...existing, ...patch };

  const { error } = await supabase
    .from('atelier_settings')
    .upsert(
      {
        key: 'biteship_activation',
        value: merged as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    console.error('[settings] failed to upsert biteship activation:', error);
    throw error;
  }
}

export async function upsertDecorationSettings(
  patch: Partial<DecorationSettings>
): Promise<void> {
  const existing = await getDecorationSettings();
  const merged: DecorationSettings = { ...existing, ...patch };

  const { error } = await supabase
    .from('atelier_settings')
    .upsert(
      {
        key: 'decoration',
        value: merged as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    console.error('[settings] failed to upsert decoration settings:', error);
    throw error;
  }
}