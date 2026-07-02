"use client";

import React, { useState, useEffect } from 'react';
import Link from '@/components/LocalizedLink';
import { usePathname, useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useBrandColor } from '@/components/BrandProvider';
import Image from 'next/image';
import { getDictionaryByLocale } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM MODERN ICONS — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CartIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4H5L6.5 15H18.5L20 6H5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 15L5.5 9H3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20" r="1" />
    <circle cx="19" cy="20" r="1" />
    <path d="M9 20L7.5 15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// SUPPORT — headphones icon (familiar customer service symbol)
const HeadphonesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 14V6C3 3.79086 4.79086 2 7 2H17C19.2091 2 21 3.79086 21 6V14" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 14C3 14 4 14 5 14C6 14 7 16 7 18V19C7 20.1046 7.89543 21 9 21H10C11.1046 21 12 20.1046 12 19V18C12 16 13 14 14 14C15 14 16 16 16 18V19C16 20.1046 16.8954 21 18 21H19C20.1046 21 21 20.1046 21 19V18C21 16 21 14 21 14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MessageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21L16.5 16.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6H20" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 12H14" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 18H10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12H19" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 5L19 12L12 19" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// ANIMATION ENGINE
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
};

const DURATION = {
  micro: 0.05,
  fast: 0.08,
  normal: 0.12,
  medium: 0.18,
  slow: 0.3,
};

// ═══════════════════════════════════════════════════════════════
// PRESS ANIMATION COMPONENT
// ═══════════════════════════════════════════════════════════════

function PressScale({ children, className = '', onClick, disabled = false }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(className, !disabled && "active:scale-[0.97] transition-transform duration-150 ease-out")}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// MENU ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════

interface MenuItemProps {
  href: string;
  label: string;
  index: number;
  onClick: () => void;
  isActive?: boolean;
  highlight?: boolean;
}

function MenuItem({ href, label, index, onClick, isActive = false, highlight = false }: MenuItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: DURATION.fast, ease: EASING.out }}
    >
      <Link
        href={href}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "flex items-center justify-between px-4 py-4 border-b border-ink/5 group transition-colors",
          isActive ? "bg-ink/5" : "hover:bg-ink/5",
          highlight && "bg-rose/[0.03] hover:bg-rose/[0.05]"
        )}
      >
        <motion.span
          className={cn(
            "text-sm font-medium uppercase tracking-[0.3em]",
            isActive ? "text-rose" : "text-ink group-hover:text-rose",
            highlight && "text-rose font-semibold"
          )}
          animate={{ x: isHovered ? 4 : 0 }}
          transition={{ duration: DURATION.fast }}
        >
          {label}
        </motion.span>
        <motion.div
          animate={{ x: isHovered ? 0 : -4, opacity: isHovered ? 1 : 0.3 }}
          transition={{ duration: DURATION.fast }}
        >
          {highlight ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          ) : (
            <ArrowRightIcon />
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ═══════════════════════════════════════════════════════════════

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  cartCount?: number;
  hideHeader?: boolean;
  hideTabBar?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string;
}

export default function MobileLayout({
  children,
  showBack = false,
  cartCount = 0,
  hideHeader = false,
  hideTabBar = false,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(lang);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [isOpeningSequence, setIsOpeningSequence] = useState(() => {
    if (pathname === '/') {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem('ninoc_intro_played') === 'true') {
        return false;
      }
      return true;
    }
    return false;
  });
  const [isNavVisible, setIsNavVisible] = useState(!isOpeningSequence);
  const brandColor = useBrandColor();

  useEffect(() => {

    const handleHide = () => {
      setIsOpeningSequence(true);
      setIsNavVisible(false);
    };
    const handleShow = () => {
      setIsOpeningSequence(false);
      setIsNavVisible(true);
    };
    
    window.addEventListener('hide-mobile-nav', handleHide);
    window.addEventListener('show-mobile-nav', handleShow);
    
    return () => {
      window.removeEventListener('hide-mobile-nav', handleHide);
      window.removeEventListener('show-mobile-nav', handleShow);
    };
  }, []);

  // Scroll-based hide/rise removed — the nav is always visible.
  // This eliminates per-frame scroll listener overhead on mobile.
  useEffect(() => {
    if (!isOpeningSequence && !isNavVisible) {
      const timer = setTimeout(() => setIsNavVisible(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpeningSequence, isNavVisible]);

  const isActive = (path: string) => pathname === path;

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const queryClean = query.trim();
      const queryFlexible = queryClean.replace(/\s+/g, '%');
      const queryNoSpace = queryClean.replace(/\s+/g, '');
      const searchCondition = `name.ilike.%${queryClean}%,name.ilike.%${queryFlexible}%,name.ilike.%${queryNoSpace}%`;

      const { data } = await supabase
        .from('products')
        .select('*')
        .or(searchCondition)
        .limit(10);
      setSearchResults(data || []);
    } catch (e) {
      console.error('Search error:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleBack = () => {
    router.back();
  };

  // Listen for support unread count
  useEffect(() => {
    const handleUnread = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSupportUnreadCount(customEvent.detail || 0);
    };
    window.addEventListener('support-unread-count', handleUnread);
    return () => window.removeEventListener('support-unread-count', handleUnread);
  }, []);

  // Menu items
  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: dict.header.shop },
    { href: '/collections', label: dict.header.collections },
    { href: '/logbook', label: dict.header.logbook },
    { href: '/track', label: dict.header.track },
    { href: '/supplier/apply', label: 'Supplier' },
    { href: '/affiliate', label: dict.header.affiliate },
    { href: '/retur', label: 'Return & Refund', highlight: true },
    { href: '/about', label: dict.header.about },
  ];

  return (
    <div className="min-h-screen bg-cr ios-native-layout flex flex-col">

      {/* Safe area top spacer */}
      <div className="h-[env(safe-area-inset-top)] bg-white/95" />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FIXED HEADER — Hide and Rise */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {(!hideHeader && !isOpeningSequence) && (
        <header
          className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[400] bg-white border-b border-ink/[0.05] will-change-transform shadow-sm"
        >
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left: Back or Logo */}
            <div className="flex items-center gap-3">
              {showBack ? (
                <PressScale onClick={handleBack} className="p-2 -ml-2 text-ink/60">
                  <BackIcon />
                </PressScale>
              ) : pathname === '/' ? (
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('ninoc_intro_played', 'true');
                      window.dispatchEvent(new CustomEvent('skip-intro'));
                    }
                  }}
                >
                  <Image 
                    src="/logo.png" 
                    alt="NINOC Logo" 
                    width={120} 
                    height={120} 
                    className="w-8 h-8 object-contain" 
                    unoptimized
                  />
                </Link>
              ) : pathname === '/retur' ? (
                <div className="flex items-center gap-3">
                  <Link href="/" className="flex items-center text-ink/60 hover:text-rose transition-colors">
                    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" className="transition-transform">
                      <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                  <span className="font-display font-medium italic text-xl tracking-tight uppercase text-ink">RETUR</span>
                </div>
              ) : pathname === '/shop' ? (
                <div className="flex items-center leading-none px-1">
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink/60">{dict.header.shop}</span>
                </div>
              ) : (
                <Link  href="/shop" className="group flex items-center gap-2 text-ink">
                  <PressScale className="flex items-center gap-2">
                    <motion.div
                      className="w-6 h-6 border border-ink/10 flex items-center justify-center bg-white"
                      whileHover={{ borderColor: brandColor.color, color: brandColor.color }}
                    >
                      <BackIcon />
                    </motion.div>
                    <div className="flex items-center leading-none">
                      <Image 
                        src="/logo.png" 
                        alt="NINOC Logo" 
                        width={120} 
                        height={120} 
                        className="w-8 h-8 object-contain" 
                        unoptimized
                      />
                    </div>
                  </PressScale>
                </Link>
              )}
            </div>

            {/* Right: Search & Burger Menu */}
            <div className="flex items-center gap-1">
              <PressScale onClick={() => setIsSearchOpen(true)} className="p-2 text-ink/50">
                <SearchIcon />
              </PressScale>
              <PressScale onClick={() => setIsMenuOpen(true)} className="p-2 text-ink/60">
                <MenuIcon />
              </PressScale>
            </div>
          </div>
        </header>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEARCH OVERLAY */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-[500]"
            />

            {/* Search Modal */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[510] bg-white border-b border-ink/5 shadow-2xl"
            >
              <div className="px-4 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative flex items-center gap-3">
                    <SearchIcon />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`SEARCH ${dict.header.shop.toUpperCase()}...`}
                      autoFocus
                      className="w-full bg-transparent py-0.5 text-xs font-medium uppercase tracking-widest text-ink placeholder:text-ink/20 outline-none"
                    />
                    {searchQuery && (
                      <motion.button
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        onClick={() => setSearchQuery('')}
                        className="text-ink/20"
                      >
                        <CloseIcon />
                      </motion.button>
                    )}
                  </div>
                  <PressScale onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="w-9 h-9 flex items-center justify-center bg-ink/5 text-ink/50 hover:bg-ink hover:text-white transition-colors">
                    <CloseIcon />
                  </PressScale>
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
                {isSearching && (
                  <div className="p-12 text-center">
                    <motion.div
                      className="w-4 h-4 border-2 border-rose/20 border-t-rose rounded-full mx-auto"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}
                {!isSearching && searchQuery && searchResults.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-xs font-medium uppercase tracking-widest text-ink/20">No items found</p>
                  </div>
                )}
                {!isSearching && searchResults.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/shop/${product.slug}`}
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                      className="flex items-center gap-4 p-4 border-t border-ink/[0.03] hover:bg-ink/[0.02] transition-colors"
                    >
                      <div className="w-12 h-16 bg-ink/[0.03] flex-shrink-0 relative border border-ink/[0.05] overflow-hidden">
                        {product.image_url && (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-ink uppercase tracking-tight">{product.name}</p>
                        <p className="text-xs text-rose italic tracking-wider mt-0.5">IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0 })}</p>
                      </div>
                      <motion.div animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <ArrowRightIcon />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SLIDE-OVER MENU */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-[500]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed inset-y-0 right-0 w-[280px] bg-white z-[510] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-6 flex items-center justify-between border-b border-ink/5">
                <div className="flex items-center gap-4">
                  <motion.span
                    className="font-display font-medium text-sm italic tracking-wider text-rose uppercase"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    Menu
                  </motion.span>
                  <div className="flex items-center gap-1.5 text-[11px] md:text-[8px] font-medium tracking-[0.2em] text-ink/60">
                    <a href={lang === 'EN' ? (pathname.replace(/^\/en/, '') || '/') : pathname} className={cn("transition-colors cursor-pointer hover:text-ink", lang !== 'EN' ? "text-ink font-bold" : "")}>
                      ID
                    </a>
                    <span className="text-ink/20">|</span>
                    <a href={lang === 'EN' ? pathname : `/en${pathname === '/' ? '' : pathname}`} className={cn("transition-colors cursor-pointer hover:text-ink", lang === 'EN' ? "text-ink font-bold" : "")}>
                      EN
                    </a>
                  </div>
                </div>
                <PressScale onClick={() => setIsMenuOpen(false)} className="p-1 text-ink/50">
                  <CloseIcon />
                </PressScale>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto py-2">
                {menuItems.map((item, index) => (
                  <MenuItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    index={index}
                    onClick={() => setIsMenuOpen(false)}
                    isActive={pathname === item.href}
                    highlight={item.highlight}
                  />
                ))}
              </div>

              {/* Cart Shortcut */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-5 py-4 border-t border-ink/5"
              >
                <Link
                  href="/checkout"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-4 bg-ink text-white"
                >
                  <span className="text-xs font-medium uppercase tracking-[0.3em]">Cart</span>
                  <div className="flex items-center gap-2">
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                    <ArrowRightIcon />
                  </div>
                </Link>
              </motion.div>

              {/* Footer */}
              <div className="px-5 py-4 bg-ink/[0.02] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/20">Information</h4>
                    <Link  href="/legal" onClick={() => setIsMenuOpen(false)} className="block text-xs font-medium uppercase tracking-widest text-ink/60">Terms & Privacy</Link>
                    <Link  href="/supplier/apply" onClick={() => setIsMenuOpen(false)} className="block text-xs font-medium uppercase tracking-widest text-ink/60">Supplier</Link>
                    <Link  href="/affiliate" onClick={() => setIsMenuOpen(false)} className="block text-xs font-medium uppercase tracking-widest text-ink/60">Affiliate</Link>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/20">Support</h4>
                    <button onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new CustomEvent('open-support-chat')); }} className="block text-left text-xs font-medium uppercase tracking-widest text-rose/60">Help Center</button>
                  </div>
                </div>

                <div className="pt-3 border-t border-ink/[0.05] flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-ink/50">
                    Bandung, ID
                  </p>
                  <div className="flex items-center gap-2 opacity-30">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-medium uppercase tracking-widest">Secure</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pb-2">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-ink/15">NINOC © 2026</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        !hideHeader && "pt-14",
        !hideTabBar && "pb-[calc(50px+env(safe-area-inset-bottom))]",
        "ios-momentum-scroll"
      )}>
        {children}
      </main>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FIXED BOTTOM TAB BAR — Hide and Rise */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!hideTabBar && !isOpeningSequence && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-[400] bg-ink border-t border-white/[0.08] ios-bottom-nav select-none will-change-transform"
        >
          <div className={cn(
            "h-[calc(50px+env(safe-area-inset-bottom))] px-2 flex items-start pt-2 pb-[env(safe-area-inset-bottom)]",
            isActive('/') ? "justify-center gap-16" : "justify-around"
          )}>

            {/* Home — only show on pages OTHER than Home */}
            {!isActive('/') && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('ninoc_intro_played', 'true');
                    router.push('/');
                  }
                }}
                className="flex flex-col items-center justify-center gap-1 py-1 px-4 min-w-[60px]"
              >
                <div
                  className={cn("transition-all duration-150", isActive('/') ? "scale-110 text-white" : "text-white/80")}
                >
                  <HomeIcon active={false} />
                </div>
                <span className="text-[7.5px] font-medium uppercase tracking-[0.1em] text-white/50">
                  Home
                </span>
              </button>
            )}

            {/* Cart */}
            <Link  href="/checkout" className="flex flex-col items-center justify-center gap-1 py-1 px-4 min-w-[60px]">
              <div className="relative">
                <div
                  className={cn("transition-all duration-150", isActive('/checkout') ? "scale-110 text-white" : "text-white/80")}
                >
                  <CartIcon active={isActive('/checkout')} />
                </div>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1.5 -right-2.5 w-3.5 h-3.5 bg-emerald-500 text-white text-[8px] font-medium rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </div>
              <span className={cn("text-[7.5px] font-medium uppercase tracking-[0.1em]", isActive('/checkout') ? "text-white" : "text-white/50")}>
                Cart
              </span>
            </Link>

            {/* Message */}
            <PressScale
              onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}
              className="flex flex-col items-center justify-center gap-1 py-1 px-4 min-w-[60px] text-white/80"
            >
              <div className="relative">
                <MessageIcon />
                {supportUnreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1.5 -right-2.5 w-3.5 h-3.5 bg-rose text-white text-[8px] font-medium rounded-full flex items-center justify-center"
                  >
                    {supportUnreadCount}
                  </motion.span>
                )}
              </div>
              <span className="text-[7.5px] font-medium uppercase tracking-wider text-white/50">Message</span>
            </PressScale>

            {/* Profile */}
            <Link  href="/profile" className="flex flex-col items-center justify-center gap-1 py-1 px-4 min-w-[60px]">
              <div
                className={cn("transition-all duration-150", isActive('/profile') ? "scale-110 text-white" : "text-white/80")}
              >
                <UserIcon active={isActive('/profile')} />
              </div>
              <span className={cn("text-[7.5px] font-medium uppercase tracking-[0.1em]", isActive('/profile') ? "text-white" : "text-white/50")}>
                Profile
              </span>
            </Link>

          </div>
        </nav>
      )}



      {/* iOS Native CSS */}
      <style jsx global>{`
        .ios-native-layout {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .ios-momentum-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: auto;
          overscroll-behavior: auto;
        }

        .ios-bottom-nav {
          padding-bottom: env(safe-area-inset-bottom);
        }

        .ios-native-layout button,
        .ios-native-layout a,
        .ios-native-layout [role="button"] {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .ios-native-layout button:active,
        .ios-native-layout a:active {
          opacity: 0.6;
        }

        .ios-native-layout ul,
        .ios-native-layout ol {
          list-style: none;
        }

        .ios-native-layout ::-webkit-scrollbar {
          display: none;
        }
        .ios-native-layout {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Smooth touch transitions */
        .ios-native-layout button,
        .ios-native-layout a {
          transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Android safe area support */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .ios-bottom-nav {
            padding-bottom: max(env(safe-area-inset-bottom), 16px);
          }
        }
      `}</style>
    </div>
  );
}
