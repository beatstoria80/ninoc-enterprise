"use client";

import React, { useState, useEffect } from 'react';
import GlobalHeader from './GlobalHeader';
import GlobalFooter from './Footer';
import MobileLayout from './platforms/mobile/MobileLayout';
import { useCart } from '@/store/useCart';
import { usePathname } from 'next/navigation';

export default function ClientPlatformManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Default to desktop to allow SSR of children and avoid blank screens.
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { items } = useCart();

  // Hide GlobalHeader/Footer on admin pages, checkout, legal, help, track, profile, retur, onboarding
  const isAdminPage = pathname?.startsWith('/admin');
  const isCheckoutPage = pathname === '/checkout';
  const isLegalPage = pathname === '/legal';
  const isHelpPage = pathname?.startsWith('/help');
  const isTrackPage = pathname === '/track';
  const isProfilePage = pathname?.startsWith('/profile');
  const isReturPage = pathname === '/retur';
  const isOnboardingPage = pathname === '/onboarding';
  const isLoginPage = pathname === '/login';
  const isAffiliateDashboard = pathname?.startsWith('/affiliate/dashboard');
  const showGlobalHeader = !isAdminPage && !isCheckoutPage && !isLegalPage && !isHelpPage && !isTrackPage && !isProfilePage && !isReturPage && !isOnboardingPage && !isLoginPage && !isAffiliateDashboard;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Removed !mounted return to ensure `children` (e.g. video) renders instantly on SSR!

  if (mounted && isMobile) {
    return (
      <MobileLayout
        cartCount={items.length}
        hideTabBar={pathname === '/checkout' || pathname === '/login' || pathname?.startsWith('/affiliate/dashboard')}
        hideHeader={pathname === '/checkout' || pathname === '/help' || pathname === '/track' || pathname?.startsWith('/profile') || pathname === '/retur' || pathname === '/onboarding' || pathname === '/login' || pathname?.startsWith('/affiliate/dashboard')}
      >
        {children}
      </MobileLayout>
    );
  }

  const isCategoryPage = pathname === '/category';
  const isCollectionsPage = pathname?.startsWith('/collections');
  const showGlobalFooter = showGlobalHeader && !isCategoryPage && !isCollectionsPage;

  return (
    <div className={`min-h-screen flex flex-col ${pathname === '/' ? 'bg-ink' : 'bg-cr'}`}>
      {/* hidden md:block prevents SSR flash of huge desktop header on mobile screens */}
      {showGlobalHeader && <div className="print:hidden hidden md:block"><GlobalHeader /></div>}
      <div className="flex-1">
        {children}
      </div>
      {showGlobalFooter && <div className="print:hidden hidden md:block"><GlobalFooter /></div>}
    </div>
  );
}
