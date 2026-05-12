"use client";

import React, { useEffect, useState } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface UseDeviceOptions {
  /** Refresh on resize (default: false) */
  watchResize?: boolean;
  /** Mobile breakpoint in pixels (default: 768) */
  mobileBreakpoint?: number;
  /** Tablet breakpoint in pixels (default: 1024) */
  tabletBreakpoint?: number;
}

/**
 * useDevice - Hook to detect device type for platform-specific UI
 *
 * @example
 * const { device, isMobile, isTablet, isDesktop } = useDevice();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * return <DesktopLayout />;
 */
export function useDevice(options: UseDeviceOptions = {}): {
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIPhone: boolean;
  hasNotch: boolean;
} {
  const {
    watchResize = false,
    mobileBreakpoint = 768,
    tabletBreakpoint = 1024
  } = options;

  const [deviceInfo, setDeviceInfo] = useState<{
    device: DeviceType;
    isIPhone: boolean;
    hasNotch: boolean;
  }>({
    device: 'desktop',
    isIPhone: false,
    hasNotch: false
  });

  const detectDevice = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return { device: 'desktop' as DeviceType, isIPhone: false, hasNotch: false };
    }

    const ua = navigator.userAgent;
    const width = window.innerWidth;

    // Detect iPhone
    const isIPhone = /iPhone|iPod/i.test(ua);

    // Detect notch (iPhone X and newer)
    // Has inset at top (notch or dynamic island)
    const hasNotch = isIPhone && (
      // Check for iPhone X and newer via screen dimensions
      window.screen.height >= 812 ||
      // Or check via CSS env support
      CSS.supports('padding-top', 'env(safe-area-inset-top)')
    );

    // Determine device type based on screen width
    let device: DeviceType = 'desktop';
    if (width < mobileBreakpoint) {
      device = 'mobile';
    } else if (width < tabletBreakpoint) {
      device = 'tablet';
    }

    return { device, isIPhone, hasNotch };
  }, [mobileBreakpoint, tabletBreakpoint]);

  useEffect(() => {
    // Initial detection - use queueMicrotask to avoid sync setState warning
    queueMicrotask(() => {
      setDeviceInfo(detectDevice());
    });

    // Watch resize if enabled
    if (watchResize) {
      let resizeTimeout: NodeJS.Timeout;

      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          setDeviceInfo(detectDevice());
        }, 150);
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
      };
    }
  }, [detectDevice, watchResize]);

  return {
    ...deviceInfo,
    isMobile: deviceInfo.device === 'mobile',
    isTablet: deviceInfo.device === 'tablet',
    isDesktop: deviceInfo.device === 'desktop'
  };
}

export default useDevice;