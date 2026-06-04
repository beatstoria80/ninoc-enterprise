"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSettings } from '@/store/useSettings';

function useBrandColorValue(): string {
  const settings = useSettings((s) => s.settings);
  return settings.accentColor;
}

function useStoreNameValue(): string {
  const settings = useSettings((s) => s.settings);
  return settings.storeName;
}

/** Returns `animate={{ color: <brandColor> }}` object for framer-motion */
export function useBrandColor(): { color: string } {
  const color = useBrandColorValue();
  return useMemo(() => ({ color }), [color]);
}

/** Returns `animate={{ color: <brandColorDark> }}` object for dark text */
export function useBrandColorDark(): { color: string } {
  const color = useBrandColorValue();
  return useMemo(() => ({ color }), [color]);
}

/** Returns store name from settings */
export function useStoreName(): string {
  return useStoreNameValue();
}

interface BrandProviderProps {
  children: React.ReactNode;
}

export default function BrandProvider({ children }: BrandProviderProps) {
  const { settings, fetchSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchSettings().then(() => setMounted(true));
  }, [fetchSettings]);

  return (
    <div
      style={{
        '--color-brand': settings.accentColor,
        '--store-name': settings.storeName,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}