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
    tagline: 'Archival Garment Studio',
    accentColor: '#E8527A',
    heroBannerUrl: '',
  };
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