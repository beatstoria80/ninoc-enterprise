"use client";

import { useEffect, useState } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface UseDeviceOptions {
  /** Mobile breakpoint in pixels (default: 768) */
  mobileBreakpoint?: number;
  /** Tablet breakpoint in pixels (default: 1024) */
  tabletBreakpoint?: number;
}

interface DeviceInfo {
  device: DeviceType;
  isIPhone: boolean;
  hasNotch: boolean;
}

/**
 * useDevice - Detect device type for platform-specific UI
 * Uses SSR-safe initial state to prevent desktop flash on mobile
 */
export function useDevice(options: UseDeviceOptions = {}): DeviceInfo & {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const { mobileBreakpoint = 768, tabletBreakpoint = 1024 } = options;

  // SSR-safe: start as mobile to prevent desktop layout flash
  const [info, setInfo] = useState<DeviceInfo>({
    device: 'mobile' as DeviceType,
    isIPhone: false,
    hasNotch: false
  });

  useEffect(() => {
    const detect = () => {
      if (typeof window === 'undefined') return;

      const ua = navigator.userAgent;
      const width = window.innerWidth;
      const isIPhone = /iPhone|iPod/i.test(ua);
      const hasNotch = isIPhone && (
        window.screen.height >= 812 ||
        CSS.supports('padding-top', 'env(safe-area-inset-top)')
      );

      let device: DeviceType = 'desktop';
      if (width < mobileBreakpoint) device = 'mobile';
      else if (width < tabletBreakpoint) device = 'tablet';

      setInfo({ device, isIPhone, hasNotch });
    };

    // Immediate detection on mount
    detect();

    // Watch resize
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(detect, 150);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [mobileBreakpoint, tabletBreakpoint]);

  return {
    ...info,
    isMobile: info.device === 'mobile',
    isTablet: info.device === 'tablet',
    isDesktop: info.device === 'desktop'
  };
}

export default useDevice;
