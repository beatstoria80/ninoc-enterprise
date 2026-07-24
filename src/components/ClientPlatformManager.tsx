"use client";

import React, { useState, useEffect } from 'react';
import GlobalHeader from './GlobalHeader';
import GlobalFooter from './Footer';
import MobileLayout from './platforms/mobile/MobileLayout';
import { useHydratedCart } from '@/store/useCart';
import { usePathname } from 'next/navigation';

export default function ClientPlatformManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Default to desktop to allow SSR of children and avoid blank screens.
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const { items } = useHydratedCart();

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
  const isRegisterPage = pathname === '/register';
  const isAffiliateDashboard = pathname?.startsWith('/affiliate/dashboard');
  
  const showGlobalHeader = !isAdminPage && !isCheckoutPage && !isLegalPage && !isHelpPage && !isTrackPage && !isReturPage && !isOnboardingPage && !isAffiliateDashboard && !isRegisterPage && !isLoginPage && !isProfilePage;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    // Debounce resize to avoid excessive re-renders (keyboard, orientation)
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/') {
      const isPlayed = sessionStorage.getItem('ninoc_intro_played') === 'true';
      if (!isPlayed) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIntroPlaying(true);
        const timer = setTimeout(() => {
          setIntroPlaying(false);
          sessionStorage.setItem('ninoc_intro_played', 'true');
        }, 3500);
        return () => clearTimeout(timer);
      }
    } else {
      sessionStorage.setItem('ninoc_intro_played', 'true');
      setIntroPlaying(false);
    }
  }, [pathname]);

  // Removed !mounted return to ensure `children` (e.g. video) renders instantly on SSR!

  const isShopPage = pathname === '/shop';
  const isCollectionsPage = pathname?.startsWith('/collections');
  const showGlobalFooter = showGlobalHeader && !isShopPage && !isCollectionsPage;

  if (mounted && isMobile) {
    return (
      <MobileLayout
        cartCount={items.length}
        hideTabBar={isCheckoutPage || isProfilePage || isOnboardingPage || isLoginPage || isRegisterPage || isAdminPage}
        hideHeader={(!showGlobalHeader && !isReturPage) || introPlaying || isShopPage}
      >
        {children}
      </MobileLayout>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${pathname === '/' ? 'bg-white' : 'bg-cr'}`}>
      {/* hidden md:block prevents SSR flash of huge desktop header on mobile screens */}
      {showGlobalHeader && <div className="print:hidden hidden md:block"><GlobalHeader /></div>}
      <div className="flex-1">
        {children}
      </div>
      {showGlobalFooter && <div className="print:hidden hidden md:block"><GlobalFooter /></div>}
    </div>
  );
}
