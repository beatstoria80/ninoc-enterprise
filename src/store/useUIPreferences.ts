import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIPreferencesState {
  dragScrollEnabled: boolean;
  setDragScrollEnabled: (enabled: boolean) => void;
}

export const useUIPreferences = create<UIPreferencesState>()(
  persist(
    (set) => ({
      dragScrollEnabled: false, // Default disabled for dashboards
      setDragScrollEnabled: (enabled) => set({ dragScrollEnabled: enabled }),
    }),
    {
      name: 'ninoc-ui-preferences',
    }
  )
);
