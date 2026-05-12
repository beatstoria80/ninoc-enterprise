"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MobileLayoutProps {
  children: React.ReactNode;
  /** Page title shown in header */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back link */
  backHref?: string;
  /** Show cart badge count */
  cartCount?: number;
  /** Hide header entirely */
  hideHeader?: boolean;
}

/**
 * MobileLayout - iOS Native Feel Layout
 *
 * Features:
 * - Fixed top header with safe area
 * - Safe area bottom padding
 * - Bottom Tab Bar
 * - iOS momentum scroll
 * - iOS font rendering
 */
export default function MobileLayout({
  children,
  title = 'NINOC',
  showBack = false,
  backHref = '/',
  cartCount = 0,
  hideHeader = false,
}: MobileLayoutProps) {
  const pathname = usePathname();

  // Determine active tab based on pathname
  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-cr ios-native-layout flex flex-col">
      {/* Safe area top spacer */}
      <div className="h-[env(safe-area-inset-top)] bg-white/95" />

      {/* Fixed Header */}
      {!hideHeader && (
        <header className="fixed top-[env(safe-area-inset-top)] inset-x-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-ink/[0.05]">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left: Back or Logo */}
            <div className="flex-1">
              {showBack ? (
                <Link href={backHref} className="flex items-center gap-2 text-ink/40 hover:text-rose transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </Link>
              ) : (
                <span className="font-display font-medium text-xl italic tracking-tighter text-rose uppercase">
                  {title}
                </span>
              )}
            </div>

            {/* Center: Title (optional) */}
            <div className="flex-1 text-center">
              {title && !showBack && (
                <span className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">
                  {title}
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex-1 flex justify-end items-center gap-3">
              <button className="p-2 text-ink/40 hover:text-rose transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
              <Link href="/checkout" className="relative p-2 text-ink/40 hover:text-rose transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6h15l-1.5 9h-12z"/>
                  <circle cx="9" cy="20" r="1"/>
                  <circle cx="18" cy="20" r="1"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose text-white text-[9px] font-medium rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Content - with top padding for header */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        !hideHeader && "pt-14",
        "pb-[calc(60px+env(safe-area-inset-bottom))]",
        "ios-momentum-scroll"
      )}>
        {children}
      </main>

      {/* Fixed Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-ink/[0.08] ios-bottom-nav">
        <div className="h-[calc(60px+env(safe-area-inset-bottom))] px-2 flex items-center justify-around">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[60px] transition-colors",
              isActive('/') ? "text-rose" : "text-ink/30"
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive('/') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/') ? 0 : 1.5}>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className={cn(
              "text-[9px] font-medium uppercase tracking-wider",
              isActive('/') && "text-rose"
            )}>
              Home
            </span>
          </Link>

          {/* Shop / Explore */}
          <Link
            href="/shop"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[60px] transition-colors",
              isActive('/shop') ? "text-rose" : "text-ink/30"
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span className={cn(
              "text-[9px] font-medium uppercase tracking-wider",
              isActive('/shop') && "text-rose"
            )}>
              Explore
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/checkout"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[60px] transition-colors",
              isActive('/checkout') ? "text-rose" : "text-ink/30"
            )}
          >
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6h15l-1.5 9h-12z"/>
                <circle cx="9" cy="20" r="1"/>
                <circle cx="18" cy="20" r="1"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose text-white text-[8px] font-medium rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className={cn(
              "text-[9px] font-medium uppercase tracking-wider",
              isActive('/checkout') && "text-rose"
            )}>
              Cart
            </span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[60px] transition-colors",
              isActive('/profile') ? "text-rose" : "text-ink/30"
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className={cn(
              "text-[9px] font-medium uppercase tracking-wider",
              isActive('/profile') && "text-rose"
            )}>
              Profile
            </span>
          </Link>
        </div>
      </nav>

      {/* iOS Native CSS */}
      <style jsx global>{`
        .ios-native-layout {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .ios-momentum-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          overscroll-behavior: contain;
        }

        .ios-bottom-nav {
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Disable tap highlight on all interactive elements */
        .ios-native-layout button,
        .ios-native-layout a,
        .ios-native-layout [role="button"] {
          -webkit-tap-highlight-color: transparent;
        }

        /* Active state feedback */
        .ios-native-layout button:active,
        .ios-native-layout a:active {
          opacity: 0.6;
        }

        /* Remove list styles */
        .ios-native-layout ul,
        .ios-native-layout ol {
          list-style: none;
        }

        /* Hide scrollbar but keep functionality */
        .ios-native-layout ::-webkit-scrollbar {
          display: none;
        }
        .ios-native-layout {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
