"use client";

import React, { useState, useEffect } from 'react';
import GlobalHeader from './GlobalHeader';
import GlobalFooter from './Footer';
import MobileLayout from './platforms/mobile/MobileLayout';
import { useCart } from '@/store/useCart';

export default function ClientPlatformManager({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { items } = useCart();

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

  // Prevent SSR hydration mismatch by showing nothing or a simple loader until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-cr flex flex-col">
        <GlobalHeader />
        <main className="flex-1">{children}</main>
        <GlobalFooter />
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileLayout cartCount={items.length}>
        {children}
      </MobileLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cr">
      <GlobalHeader />
      <div className="flex-1">
        {children}
      </div>
      <GlobalFooter />
    </div>
  );
}
