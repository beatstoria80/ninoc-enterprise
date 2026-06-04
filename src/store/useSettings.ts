import { create } from 'zustand';
import { getDecorationSettings, upsertDecorationSettings } from '@/lib/settings';
import type { DecorationSettings } from '@/lib/settings';

interface SettingsStore {
  settings: DecorationSettings;
  loading: boolean;
  initialized: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (patch: Partial<DecorationSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: DecorationSettings = {
  storeName: 'NINOC',
  tagline: 'Archival Garment Studio',
  accentColor: '#E8527A',
  heroBannerUrl: '',
};

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  initialized: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const data = await getDecorationSettings();
      set({ settings: data, initialized: true });
    } catch {
      set({ initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (patch) => {
    const prev = get().settings;
    set({ settings: { ...prev, ...patch } });
    try {
      await upsertDecorationSettings(patch);
    } catch {
      set({ settings: prev });
      throw new Error('Failed to save settings');
    }
  },
}));
