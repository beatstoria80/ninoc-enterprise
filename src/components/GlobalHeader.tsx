"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Search, ShoppingBag, User, X, Trash2, ShieldCheck, Plus, Minus, ArrowLeft, Truck, Menu, LogOut, Bell } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useHydratedCart, useCart } from '@/store/useCart';
import { useBrandColor } from '@/components/BrandProvider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import ImageLightbox from '@/components/ImageLightbox';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════
// EMIL KOWALSKI ANIMATION ENGINE — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

const EASING = {
  // Strong ease-out for UI interactions (buttons, hovers)
  out: [0.23, 1, 0.32, 1] as const,
  // Smooth ease-in-out for on-screen movement
  inOut: [0.77, 0, 0.175, 1] as const,
  // Spring-based for interactive elements
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  // Snappy spring for buttons
  springSnappy: { type: "spring" as const, stiffness: 500, damping: 25 },
};

const DURATION = {
  micro: 0.05,    // 100ms - button press feedback
  fast: 0.08,    // 150ms - small hover
  normal: 0.12,   // 200ms - standard transitions
  medium: 0.18,   // 300ms - modals, drawers
  slow: 0.3,     // 500ms - page transitions
};

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  slug: string;
}

// ═══════════════════════════════════════════════════════════════
// PRESS SCALE BUTTON WRAPPER
// ═══════════════════════════════════════════════════════════════

function PressScale({ children, className = '', onClick, disabled }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(className, !disabled && "active:scale-[0.97] transition-transform duration-150 ease-out")}
    >
      {children}
    </motion.button>
  );
}

function PressButton({ children, className = '', onClick, disabled }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(className, "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 rounded-md", !disabled && "active:scale-[0.97] transition-transform duration-150 ease-out")}
    >
      {children}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAV LINK WITH SPRING HOVER
// ═══════════════════════════════════════════════════════════════

function NavLink({ href, children, isDark, index = 0 }: { href: string; children: React.ReactNode; isDark?: boolean; index?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const scaleX = useSpring(0, EASING.springSnappy);
  const pathname = usePathname() || '';

  const isActive = React.useMemo(() => {
    const cleanPath = pathname.replace(/^\/en/, '') || '/';
    const targetPath = href.split('?')[0];
    const targetQuery = href.includes('?') ? href.split('?')[1] : '';

    if (targetPath === '/logbook') {
      return cleanPath.startsWith('/logbook');
    }
    if (targetPath === '/about') {
      return cleanPath.startsWith('/about');
    }
    if (targetPath === '/shop') {
      if (cleanPath.startsWith('/shop') || cleanPath.startsWith('/collections')) {
        if (typeof window !== 'undefined' && targetQuery) {
          const queryVal = targetQuery.split('=')[1]?.toLowerCase();
          const searchVal = window.location.search.toLowerCase();
          if (searchVal.includes(queryVal)) return true;
          if (cleanPath.toLowerCase().includes(queryVal)) return true;
        }
        return false;
      }
    }
    return cleanPath === targetPath && targetPath !== '/';
  }, [pathname, href]);

  useEffect(() => {
    scaleX.set(isActive || isHovered ? 1 : 0);
  }, [isActive, isHovered, scaleX]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.05), duration: DURATION.medium, ease: EASING.out }}
    >
      <Link
        href={href}
        className={cn(
          "no-drag pointer-events-auto cursor-pointer text-sm md:text-[10px] lg:text-[9.5px] xl:text-[11px] uppercase tracking-[0.18em] lg:tracking-[0.18em] xl:tracking-[0.28em] whitespace-nowrap relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 rounded-md transition-all duration-200 block py-1",
          isActive
            ? (isDark ? "font-bold text-white drop-shadow-sm" : "font-bold text-ink drop-shadow-[0_0.5px_0_rgba(20,20,20,1)]")
            : (isDark ? "font-medium text-white/80 hover:text-white" : "font-medium text-ink/50 hover:text-rose")
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="inline-block transition-transform duration-150 ease-out active:scale-[0.97]">{children}</span>
        <motion.span
          className={cn(
            "absolute -bottom-1.5 left-0 right-0 origin-left transition-colors",
            isActive ? "h-[2px]" : "h-[1px]",
            isActive
              ? (isDark ? "bg-white" : "bg-ink")
              : (isDark ? "bg-white/60" : "bg-rose")
          )}
          style={{ scaleX }}
        />
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAGGERED CART ITEM
// ═══════════════════════════════════════════════════════════════

function HeaderCartItemImage({ item, isHovered }: { item: { id: string; name: string; color?: string; size?: string; image_url?: string | null }; isHovered: boolean }) {
  const [fetchedOverride, setFetchedOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!item.color || !item.id) return;

    let isMounted = true;
    const fetchColorPhoto = async () => {
      try {
        const safeColor = item.color!.trim().toUpperCase();
        const { data } = await supabase
          .from('specifications')
          .select('label, value')
          .eq('product_id', item.id);

        if (!isMounted || !data) return;

        const specMatch = data.find(spec => {
          if (!spec.label || !spec.value) return false;
          const m = spec.label.match(/^color\s*(image)?\s*:\s*(.+)$/i);
          return m && m[2].trim().toUpperCase() === safeColor && spec.value.trim();
        });

        if (specMatch && specMatch.value?.trim()) {
          const img = specMatch.value.trim();
          setFetchedOverride(img);
          const currentItems = useCart.getState().items;
          const needsUpdate = currentItems.some(i => i.id === item.id && i.size === item.size && i.color === item.color && i.image_url !== img);
          if (needsUpdate) {
            useCart.setState(state => ({
              items: state.items.map(i => (i.id === item.id && i.size === item.size && i.color === item.color) ? { ...i, image_url: img } : i)
            }));
          }
          return;
        }

        const { data: varData } = await supabase
          .from('variants')
          .select('image_url')
          .eq('product_id', item.id)
          .ilike('color', safeColor)
          .limit(1);

        if (isMounted && varData && varData[0]?.image_url) {
          const img = varData[0].image_url;
          setFetchedOverride(img);
          const currentItems = useCart.getState().items;
          const needsUpdate = currentItems.some(i => i.id === item.id && i.size === item.size && i.color === item.color && i.image_url !== img);
          if (needsUpdate) {
            useCart.setState(state => ({
              items: state.items.map(i => (i.id === item.id && i.size === item.size && i.color === item.color) ? { ...i, image_url: img } : i)
            }));
          }
        }
      } catch (err) {
        console.error('HeaderCartItemImage resolve error:', err);
      }
    };

    fetchColorPhoto();
    return () => { isMounted = false; };
  }, [item.id, item.color, item.size]);

  const src = fetchedOverride || item.image_url;
  return src ? (
    <Image
      src={src}
      alt={item.name}
      fill
      className="object-contain p-2 transition-all duration-700"
      style={{
        filter: isHovered ? 'grayscale(0%)' : 'grayscale(0%)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    />
  ) : null;
}

function CartItem({
  item,
  index,
  onRemove,
  onQuantityChange,
  onImageClick
}: {
  item: { id: string; name: string; price: number; quantity: number; size?: string; color?: string; image_url?: string | null; maxStock?: number; warehouse_name?: string };
  index: number;
  onRemove: () => void;
  onQuantityChange: (delta: number) => void;
  onImageClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{
        delay: index * 0.05,
        duration: DURATION.medium,
        ease: EASING.out,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex gap-4 group"
    >
      <motion.div
        onClick={onImageClick}
        className="w-16 h-20 bg-white rounded-none overflow-hidden flex-shrink-0 relative border border-ink/5 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: DURATION.fast, ease: EASING.out }}
      >
        <HeaderCartItemImage item={item} isHovered={isHovered} />
      </motion.div>

      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <motion.h3
              className="text-xs font-display font-medium italic uppercase tracking-tight"
              animate={isHovered ? brandColor : darkColor}
              transition={{ duration: DURATION.fast }}
            >
              {item.name}
            </motion.h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-ink/40 hover:text-rose p-1 -mt-1 -mr-1 transition-colors flex-shrink-0"
              title="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/50 italic">Ref: #{item.id.slice(0, 8)}</p>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1.5">
            <motion.div
              className="flex items-center gap-3 bg-ink/5 px-3 py-1.5 rounded-none w-fit"
              whileHover={{ backgroundColor: 'rgba(20,20,20,0.1)' }}
            >
              <PressScale
                onClick={() => item.quantity > 1 && onQuantityChange(-1)}
                disabled={item.quantity <= 1}
                className="text-ink/50 hover:text-rose p-0.5 disabled:opacity-30"
              >
                <Minus size={12} strokeWidth={2} />
              </PressScale>
              <motion.span
                key={item.quantity}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: DURATION.micro }}
                className="text-xs font-medium w-6 text-center"
              >
                {item.quantity}
              </motion.span>
              <PressScale onClick={() => onQuantityChange(1)} disabled={item.maxStock ? item.quantity >= item.maxStock : false} className="text-ink/50 hover:text-rose p-0.5 disabled:opacity-30 disabled:pointer-events-none">
                <Plus size={12} strokeWidth={2} />
              </PressScale>
            </motion.div>
            {item.warehouse_name && (
              <div className="text-[9px] md:text-[6.5px] font-medium uppercase tracking-widest text-ink/50 mb-0.5">
                🚚 Dikirim dari {item.warehouse_name}
              </div>
            )}
            <div className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/60">Size {item.size || 'N/A'}</div>
          </div>
          <motion.div
            className="text-sm font-display font-semibold italic text-rose"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: DURATION.fast }}
          >
            IDR {(item.price * item.quantity).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SEARCH RESULT ITEM
// ═══════════════════════════════════════════════════════════════

function SearchResultItem({ product, index, onClick }: {
  product: Product;
  index: number;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: DURATION.fast, ease: EASING.out }}
    >
      <Link
        href={`/shop/${product.slug}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex gap-4 group p-2 hover:bg-ink/5 transition-all"
      >
        <motion.div
          className="w-12 h-16 bg-ink/5 flex-shrink-0 relative border border-ink/5 overflow-hidden"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: DURATION.fast, ease: EASING.out }}
        >
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-1 transition-all duration-500"
              style={{ filter: isHovered ? 'grayscale(0%)' : 'grayscale(0%)' }}
            />
          )}
        </motion.div>
        <div className="flex flex-col justify-center">
          <motion.h3
            className="text-xs md:text-[10px] font-medium uppercase tracking-tight"
            animate={isHovered ? brandColor : darkColor}
            transition={{ duration: DURATION.fast }}
          >
            {product.name}
          </motion.h3>
          <motion.p
            className="text-xs md:text-[9px] font-medium text-ink/50 mt-0.5 italic"
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            transition={{ duration: DURATION.fast }}
          >
            IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </motion.p>
        </div>
        <motion.div
          className="ml-auto flex items-center"
          animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.3 }}
          transition={{ duration: DURATION.fast }}
        >
          <ArrowLeft className="w-3 h-3 rotate-180" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL HEADER
// ═══════════════════════════════════════════════════════════════

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const lang: Locale = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(lang);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { items, removeItem, updateQuantity, totalPrice, isHydrated } = useHydratedCart();

  const cartItemsCount = isHydrated ? items.length : 0;

  // Auto-open drawer menu on homepage (TIDAK di opening/intro)
  useEffect(() => {
    if (pathname === '/' || pathname === '/en') {
      const openDrawer = () => {
        const timer = setTimeout(() => {
          setIsMenuOpen(true);
        }, 1000); // Delay sedikit agar animasi entrance UI selesai dulu
        return timer;
      };

      if (typeof window !== 'undefined' && sessionStorage.getItem('ninoc_intro_played') === 'true') {
        // Jika intro sudah pernah diputar, langsung jadwalkan buka
        const timer = openDrawer();
        return () => clearTimeout(timer);
      } else {
        // Jika sedang di intro (opening), tunggu sampai intro selesai ('show-mobile-nav' dipicu)
        let timer: NodeJS.Timeout | null = null;
        let hasOpened = false;
        
        const handleIntroFinish = () => {
          if (hasOpened) return; // Prevent multiple triggers
          hasOpened = true;
          if (timer) clearTimeout(timer);
          timer = openDrawer();
        };
        
        window.addEventListener('show-mobile-nav', handleIntroFinish);
        return () => {
          window.removeEventListener('show-mobile-nav', handleIntroFinish);
          if (timer) clearTimeout(timer);
        };
      }
    }
  }, [pathname]);

  // Scroll handler with debounce
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    const handleScroll = () => {
      if (!scrollTimer) {
        scrollTimer = setTimeout(() => {
          setIsScrolled(window.scrollY > 20);
          scrollTimer = undefined;
        }, 16);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // User profile fetch
  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('customer_profiles')
        .select('avatar_url, full_name')
        .eq('user_id', userId)
        .single();
      if (data?.avatar_url) setProfileAvatar(data.avatar_url);
      if (data?.full_name) setProfileName(data.full_name);

      const { count } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      setUnreadNotifications(count || 0);

      const channel = supabase
        .channel(`notifications-${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        }, () => {
          // Re-fetch count when any notification changes
          supabase
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)
            .then(({ count }) => setUnreadNotifications(count || 0));
        })
        .subscribe();

      // Return cleanup logic for subscription if needed, or handle in component unmount
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfileAvatar(null);
        setProfileName(null);
        setUnreadNotifications(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global overlay state manager
  useEffect(() => {
    if (isCartOpen || isMenuOpen || isSearchOpen) {
      document.documentElement.classList.add('drawer-open');
    } else {
      document.documentElement.classList.remove('drawer-open');
    }
    return () => {
      document.documentElement.classList.remove('drawer-open');
    };
  }, [isCartOpen, isMenuOpen, isSearchOpen]);

  // Search debounce
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const queryClean = searchQuery.trim();
      const queryFlexible = queryClean.replace(/\s+/g, '%');
      const queryNoSpace = queryClean.replace(/\s+/g, '');
      const searchCondition = `name.ilike.%${queryClean}%,name.ilike.%${queryFlexible}%,name.ilike.%${queryNoSpace}%`;

      const { data } = await supabase
        .from('products')
        .select('*')
        .or(searchCondition)
        .limit(5);
      setSearchResults(data || []);
      setIsSearching(false);
    };
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isCollectionsPath = pathname?.match(/^\/(?:en\/)?collections\/.+/);
  const isDarkBg = Boolean(isCollectionsPath && !isScrolled);
  const isSupplierApply = pathname?.endsWith('/supplier/apply') || pathname?.endsWith('/supplier/terms') || pathname?.endsWith('/affiliate') || pathname?.endsWith('/affiliate/terms');

  return (
    <>
      {/* NAVIGATION BAR */}
      {!isSupplierApply ? (
        <nav
          className={cn(
            "no-drag pointer-events-auto fixed top-0 inset-x-0 z-[150] px-3 md:px-12 py-3 md:py-5 transition-colors duration-700",
            isScrolled ? "bg-white border-b border-ink/5" : "bg-transparent"
          )}
        >
          <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-1 md:gap-5">
            {/* Drawer Menu Toggle (3 Dots) */}
            <PressScale 
              onClick={() => setIsMenuOpen(true)} 
              className={cn("transition-colors cursor-pointer p-2 -ml-5 md:-ml-5 md:-my-2 md:-mr-2 flex items-center justify-center", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}
            >
              <Menu size={20} strokeWidth={1.5} />
            </PressScale>

            {/* Logo */}
            <motion.div className="relative flex items-center">
              <Link
                href="/"
                className="cursor-pointer group flex items-center focus:outline-none rounded-sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('ninoc_intro_played', 'true');
                    if (window.location.pathname === '/' || window.location.pathname === '/en') {
                      window.dispatchEvent(new CustomEvent('skip-intro'));
                    }
                  }
                }}
              >
                <motion.div
                  className={cn("active:scale-[0.97] active:blur-[2px] active:opacity-70 transition-all duration-200 ease-out flex items-center gap-1.5", isDarkBg ? "text-white" : "text-rose")}
                  whileHover={{ scale: 1.02 }}
                >
                  <Image 
                    src="/logo.png" 
                    alt="NINOC Logo" 
                    width={120} 
                    height={120} 
                    className="w-10 h-10 md:w-12 md:h-12 object-contain" 
                    priority 
                    unoptimized
                  />
                </motion.div>
              </Link>

            {/* Back navigation on inner pages removed as requested */}
            </motion.div>
          </div>

        {/* Navigation Links - Hidden on mobile, shown on lg */}
        <motion.div
          className="no-drag pointer-events-auto z-20 hidden lg:flex items-center gap-4 lg:gap-5 xl:gap-10 2xl:gap-14 absolute left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-[0.18em] whitespace-nowrap"
        >
          <NavLink index={0} isDark={isDarkBg} href="/shop?filter=Apparel">Apparel</NavLink>
          <NavLink index={1} isDark={isDarkBg} href="/shop?filter=Objects">Home & Living</NavLink>
          <NavLink index={2} isDark={isDarkBg} href="/shop?filter=Pantry">Pantry & Café</NavLink>
          <NavLink index={3} isDark={isDarkBg} href="/logbook">{dict.header.logbook}</NavLink>
          <NavLink index={4} isDark={isDarkBg} href="/about">{dict.header.about}</NavLink>
        </motion.div>

        {/* Action Icons */}
        <motion.div
          className="flex items-center gap-5 md:gap-7"
        >
          {/* Language Toggle - Hidden on Desktop & Laptop/Tablet since available in menu slide bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: DURATION.fast }}
            className={cn("flex md:hidden items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] px-2.5 py-1.5 rounded-full border transition-colors", isDarkBg ? "border-white/15" : "border-ink/10")}
          >
            <a href={lang === 'EN' ? (pathname.replace(/^\/en/, '') || '/') : pathname} className={cn("transition-colors cursor-pointer", lang !== 'EN' ? (isDarkBg ? "text-white" : "text-ink") : (isDarkBg ? "text-white/40 hover:text-white" : "text-ink/50 hover:text-ink"))}>
              ID
            </a>
            <span className={isDarkBg ? "text-white/20" : "text-ink/10"}>·</span>
            <a href={lang === 'EN' ? pathname : `/en${pathname === '/' ? '' : pathname}`} className={cn("transition-colors cursor-pointer", lang === 'EN' ? (isDarkBg ? "text-white" : "text-ink") : (isDarkBg ? "text-white/40 hover:text-white" : "text-ink/50 hover:text-ink"))}>
              EN
            </a>
          </motion.div>

          {/* Search Button */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, duration: DURATION.fast }} className="flex items-center">
            <PressScale onClick={() => setIsSearchOpen(true)} className={cn("transition-colors p-2 -m-2 flex items-center justify-center", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}>
              <Search size={18} strokeWidth={1.5} />
            </PressScale>
          </motion.div>

          {/* Tracking Button */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: DURATION.fast }} className="flex items-center">
            <PressScale className={cn("transition-colors p-2 -m-2 flex items-center justify-center", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}>
              <Link  href="/track" className="flex items-center">
                <Truck size={18} strokeWidth={1.5} />
              </Link>
            </PressScale>
          </motion.div>

          {/* Notification Button (Only if logged in) */}
          {user && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.52, duration: DURATION.fast }} className="flex items-center">
              <PressScale className={cn("transition-colors p-2 -m-2 flex items-center justify-center", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}>
                <Link href="/profile/notifications" className="flex items-center justify-center relative">
                  <Bell size={18} strokeWidth={1.5} />
                  {unreadNotifications > 0 && (
                    <div className="absolute -top-1 -right-1 w-[14px] h-[14px] bg-rose text-white text-[8px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-ink" />
                  )}
                </Link>
              </PressScale>
            </motion.div>
          )}

          {/* User Profile */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, duration: DURATION.fast }} className="flex items-center">
            <PressScale className={cn("transition-colors p-2 -m-2 flex items-center justify-center", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}>
              <Link  href={user ? "/profile" : "/login"} className="flex items-center justify-center relative">
                {profileAvatar ? (
                  <div className={cn("relative w-[20px] h-[20px] rounded-full overflow-hidden shadow-sm ring-1 ring-offset-1", isDarkBg ? "ring-white/20 ring-offset-transparent" : "ring-ink/10 ring-offset-white")}>
                    <Image src={profileAvatar} alt="Profile" fill className="object-cover" />
                  </div>
                ) : user ? (
                  <div className={cn("w-[20px] h-[20px] rounded-full flex items-center justify-center text-[9px] font-bold ring-1 ring-offset-1", isDarkBg ? "bg-white/10 text-white ring-white/20 ring-offset-transparent" : "bg-ink/5 text-ink ring-ink/10 ring-offset-white")}>
                    {profileName ? profileName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                ) : (
                  <User size={18} strokeWidth={1.5} />
                )}
              </Link>
            </PressScale>
          </motion.div>

          {/* Cart Button */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: DURATION.fast }} className="flex items-center">
            <PressScale
              onClick={() => {
                if (cartItemsCount >= 4) {
                  router.push('/cart');
                } else {
                  setIsCartOpen(true);
                }
              }}
              className="group p-2 -m-2 flex items-center justify-center"
            >
              <div className="relative flex items-center justify-center">
                <div className={cn("transition-colors", isDarkBg ? "text-white group-hover:text-white/80" : "text-ink/70 group-hover:text-rose")}>
                  <ShoppingBag size={18} strokeWidth={1.5} />
                </div>
                <AnimatePresence>
                  {cartItemsCount > 0 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ duration: DURATION.micro, ease: EASING.out }}
                      key={cartItemsCount}
                      className="absolute -top-1.5 -right-1.5 w-[14px] h-[14px] bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full shadow-sm"
                    >
                      {cartItemsCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </PressScale>
          </motion.div>
        </motion.div>
        </div>
      </nav>
      ) : (
        <div className="fixed top-0 inset-x-0 z-[150] px-3 md:px-6 pt-3 md:pt-4 pb-6 flex items-start justify-between pointer-events-none">
          <div className="pointer-events-auto -ml-5">
            <PressScale 
              onClick={() => setIsMenuOpen(true)} 
              className="text-ink/60 hover:text-rose transition-colors cursor-pointer block p-1"
            >
              <Menu size={20} strokeWidth={1.5} />
            </PressScale>
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5 text-[10px] md:text-[9px] font-semibold tracking-[0.15em] text-ink/60 mt-1 px-2.5 py-1.5 rounded-full border border-ink/10">
            <a href={lang === 'EN' ? ((pathname as string).replace(/^\/en/, '') || '/') : pathname} className={cn("transition-colors cursor-pointer hover:text-ink", lang !== 'EN' ? "text-ink font-bold" : "text-ink/50")}>
              ID
            </a>
            <span className="text-ink/10">·</span>
            <a href={lang === 'EN' ? pathname : `/en${(pathname as string) === '/' ? '' : pathname}`} className={cn("transition-colors cursor-pointer hover:text-ink", lang === 'EN' ? "text-ink font-bold" : "text-ink/50")}>
              EN
            </a>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CART OVERLAY — ASYMMETRIC 3-SECTOR ARCHIVAL INVENTORY */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.normal }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-[300]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md md:max-w-lg bg-cr noise z-[310] shadow-2xl flex flex-col border-l border-ink/5"
            >
              {/* Header */}
              <div className="px-6 py-6 flex items-center justify-between border-b border-ink/5">
                <div className="flex items-center gap-4">
                  <span className="font-display font-medium text-xl italic tracking-tighter text-rose uppercase">
                    Active Selection
                  </span>
                  <span className="h-4 w-[1px] bg-ink/10" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-ink/60">{cartItemsCount} Units</span>
                </div>
                <PressScale onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center text-ink hover:bg-rose hover:text-white">
                  <X size={14} />
                </PressScale>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-4">
                {isHydrated && cartItemsCount > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <CartItem
                        key={`${item.id}-${item.size}-${item.color}`}
                        item={item}
                        index={index}
                        onRemove={() => removeItem(item.id, item.size, item.color)}
                        onQuantityChange={(delta) => updateQuantity(item.id, item.quantity + delta, item.size, item.color)}
                        onImageClick={() => item.image_url && setFullscreenImage(item.image_url)}
                      />
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 my-auto py-12">
                    <div className="text-ink/20">
                      <ShoppingBag size={48} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.4em]">Empty Selection</p>
                      <p className="text-[10px] text-ink/60 tracking-wider">Your cart is currently empty.</p>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-6 py-2.5 border border-ink/10 text-[10px] font-medium uppercase tracking-widest hover:bg-ink hover:text-white transition-colors cursor-pointer"
                    >
                      Shop Now
                    </button>
                  </div>
                )}
              </div>

              {/* Footer (only if items > 0) */}
              {cartItemsCount > 0 && (
                <div className="px-6 py-6 border-t border-ink/5 bg-white space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                      <span>Raw Value</span>
                      <span>IDR {totalPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                      <span>Handling Fee</span>
                      <span className="text-emerald-600 italic">Complimentary</span>
                    </div>
                    <div className="h-[1px] bg-ink/5 my-2" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60">Total</span>
                      <span className="text-xl font-display font-semibold italic text-emerald-700">
                        IDR {totalPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full bg-ink text-white py-3.5 font-medium text-[9px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2"
                    >
                      <span className="flex items-center gap-3">
                        <span>{user ? 'Proceed to Checkout' : 'Guest Checkout'}</span>
                      </span>
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full border border-ink text-ink hover:bg-ink hover:text-white py-3 font-medium text-[9px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-colors cursor-pointer focus:outline-none"
                    >
                      <span>View Shopping Bag</span>
                    </Link>
                    <div className="flex items-center justify-center gap-2 opacity-30 grayscale mt-1">
                      <ShieldCheck size={12} />
                      <span className="text-[7px] font-medium uppercase tracking-[0.2em]">Secure Transaction</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              transition={{ duration: DURATION.fast }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-ink/10 backdrop-blur-[2px] z-[200]"
            />

            {/* Search Bar */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 inset-x-0 z-[210] bg-white border-b border-ink/5 pt-[env(safe-area-inset-top)]"
            >
              <div className="px-6 md:px-12 py-4 flex items-center justify-between gap-8 max-w-[1800px] mx-auto">
                <div className="flex-1 flex items-center gap-4 relative">
                  <motion.div
                    animate={{ scale: isSearching ? 1.1 : 1 }}
                    transition={{ duration: DURATION.fast }}
                  >
                    <Search size={16} className="text-ink/50" />
                  </motion.div>
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search catalog..."
                    className="flex-1 bg-transparent py-2 text-xs font-medium uppercase tracking-[0.2em] outline-none placeholder:text-ink/20"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearchQuery('')}
                        className="text-ink/20 hover:text-rose"
                      >
                        <X size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <PressScale onClick={() => setIsSearchOpen(false)} className="w-9 h-9 flex items-center justify-center bg-ink/5 text-ink/50 hover:bg-ink hover:text-white transition-colors">
                  <X size={16} />
                </PressScale>
              </div>

              {/* Results Dropdown */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: DURATION.normal, ease: EASING.out }}
                    className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-ink/5 max-h-[400px] overflow-y-auto no-scrollbar"
                  >
                    <div className="px-6 md:px-12 py-8 max-w-[1800px] mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                          {searchResults.length > 0 ? (
                            searchResults.map((product, index) => (
                              <SearchResultItem
                                key={product.id}
                                product={product}
                                index={index}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                              />
                            ))
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="col-span-full py-4 text-center"
                            >
                              <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/20">No matching items found</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MOBILE / OFFCANVAS MENU */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] z-[400]"
            />

            {/* Menu Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 w-[85vw] max-w-[400px] h-full max-h-screen bg-cr noise z-[410] border-r border-ink/5 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-6 md:px-10 py-6 border-b border-ink/5 flex items-center justify-between shrink-0">
                <div className="flex items-center">
                  <Image 
                    src="/logo.png" 
                    alt="NINOC Logo" 
                    width={120} 
                    height={120} 
                    className="w-12 h-12 object-contain" 
                    unoptimized
                  />
                </div>
                <motion.button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center hover:bg-rose hover:text-white focus:outline-none"
                  animate={{ color: ['#141414', '#e11d48', '#141414'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} strokeWidth={2.5} />
                </motion.button>
              </div>

              <div className="overflow-y-auto no-scrollbar px-6 md:px-10 py-8 flex-1 flex flex-col gap-6">
                {/* Member Info Section */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DURATION.medium, ease: EASING.out }}
                    className="flex items-center gap-3 pb-5 border-b border-ink/10"
                  >
                    {profileAvatar ? (
                      <div className="relative w-10 h-10 shrink-0">
                        {unreadNotifications > 0 && (
                          <div className="absolute 0 top-0 right-0 w-3 h-3 bg-rose rounded-full border-2 border-white dark:border-cr z-10 animate-pulse" />
                        )}
                        <Image src={profileAvatar} alt="Profile" fill className="object-cover rounded-full border-2 border-rose/20" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center text-sm font-bold text-rose shrink-0">
                        {profileName ? profileName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm md:text-xs font-bold uppercase tracking-wider text-ink truncate">
                        {profileName || 'Member'}
                      </span>
                      <span className="text-[11px] md:text-[8px] font-medium text-ink/60 truncate">
                        {user.email}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* ══ SECTION 1: DEPARTMENT PORTAL GATEWAY (PILLAR SWITCHER) ══ */}
                <div className="flex flex-col gap-3 pb-6 border-b border-ink/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.3em] text-rose">
                      Life Style
                    </span>
                  </div>
                  
                  {/* Portal 01: Apparel */}
                  <Link
                    href="/shop?filter=Apparel"
                    onClick={() => setIsMenuOpen(false)}
                    className="group relative flex items-center justify-between p-3 bg-ink/[0.02] hover:bg-rose/[0.04] border border-ink/10 hover:border-rose/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-rose/10 text-rose flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink group-hover:text-rose transition-colors">
                          Apparel
                        </span>
                        <span className="text-[10px] text-ink/50 font-medium">
                          Fashion · Garment · Footwear
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Portal 02: Objects & Goods */}
                  <Link
                    href="/shop?filter=Objects"
                    onClick={() => setIsMenuOpen(false)}
                    className="group relative flex items-center justify-between p-3 bg-ink/[0.02] hover:bg-rose/[0.04] border border-ink/10 hover:border-rose/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-rose/10 text-rose flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink group-hover:text-rose transition-colors">
                          Home & Living
                        </span>
                        <span className="text-[10px] text-ink/50 font-medium">
                          Homeware · Ceramics · Decor
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Portal 03: Pantry & Café */}
                  <Link
                    href="/shop?filter=Pantry"
                    onClick={() => setIsMenuOpen(false)}
                    className="group relative flex items-center justify-between p-3 bg-ink/[0.02] hover:bg-rose/[0.04] border border-ink/10 hover:border-rose/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-rose/10 text-rose flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 8h1a4 4 0 110 8h-1" />
                          <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                          <line x1="6" y1="2" x2="6" y2="4" />
                          <line x1="10" y1="2" x2="10" y2="4" />
                          <line x1="14" y1="2" x2="14" y2="4" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink group-hover:text-rose transition-colors">
                          Pantry & Café
                        </span>
                        <span className="text-[10px] text-ink/50 font-medium">
                          Specialty Coffee · Pastry · RTD
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* ══ SECTION 2: CATALOG & EXPLORE ══ */}
                <div className="flex flex-col gap-3.5 pb-6 border-b border-ink/10">
                  <span className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.3em] text-ink/40">
                    Catalog & Explore
                  </span>
                  {[
                    { label: 'Shop All Products', href: '/shop' },
                    { label: dict.header.collections, href: '/collections' },
                    { label: dict.header.logbook, href: '/logbook' },
                    { label: dict.header.about, href: '/about' },
                  ].map((item, idx) => {
                    const cleanPath = (pathname || '').replace(/^\/en/, '') || '/';
                    const isItemActive = item.href === '/logbook' ? cleanPath.startsWith('/logbook') : item.href === '/about' ? cleanPath.startsWith('/about') : item.href === '/collections' ? cleanPath.startsWith('/collections') : cleanPath === '/shop';
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (idx * 0.05), duration: DURATION.medium, ease: EASING.out }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-between py-1.5 px-2 rounded-sm",
                            isItemActive
                              ? "font-black text-ink bg-ink/5 border-l-2 border-ink pl-3"
                              : "font-bold text-ink/70 hover:text-rose"
                          )}
                        >
                          <span>{item.label}</span>
                          <span className={isItemActive ? "text-ink font-bold" : "text-ink/20"}>→</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ══ SECTION 3: SERVICES, SUPPLIER & POLICIES ══ */}
                <div className="flex flex-col gap-3.5">
                  <span className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.3em] text-ink/40">
                    Services & Policies
                  </span>
                  {[
                    { label: 'Return & Refund', href: '/retur', highlight: true },
                    { label: 'Supplier Dashboard', href: '/supplier' },
                    { label: 'Mitra Supplier (B2B)', href: '/supplier/apply' },
                    { label: dict.header.affiliate, href: '/affiliate' },
                    { label: dict.header.shippingTerms, href: '/help/shipping-payment' },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + (idx * 0.05), duration: DURATION.medium, ease: EASING.out }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-between",
                          item.highlight ? "text-rose hover:text-rose/80" : "text-ink/70 hover:text-rose"
                        )}
                      >
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Logout Button for Members */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55, duration: DURATION.medium, ease: EASING.out }}
                    className="pt-4 border-t border-ink/10"
                  >
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setIsMenuOpen(false);
                        window.location.href = '/';
                      }}
                      className="flex items-center gap-2 text-sm md:text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-rose/70 hover:text-rose transition-colors cursor-pointer"
                    >
                      <LogOut size={14} strokeWidth={2} />
                      <span>Keluar / Logout</span>
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="px-6 md:px-10 py-6 border-t border-ink/5 bg-white">
                <p className="text-xs md:text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50 mb-3">Language</p>
                <div className="flex items-center gap-1.5 text-xs md:text-[10px] font-medium tracking-[0.2em] text-ink/60">
                  <a onClick={() => setIsMenuOpen(false)} href={lang === 'EN' ? ((pathname as string).replace(/^\/en/, '') || '/') : pathname} className={cn("transition-colors cursor-pointer hover:text-ink", lang !== 'EN' ? "text-ink font-bold" : "")}>
                    ID
                  </a>
                  <span className="text-ink/20">|</span>
                  <a onClick={() => setIsMenuOpen(false)} href={lang === 'EN' ? pathname : `/en${(pathname as string) === '/' ? '' : pathname}`} className={cn("transition-colors cursor-pointer hover:text-ink", lang === 'EN' ? "text-ink font-bold" : "")}>
                    EN
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ImageLightbox
        isOpen={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </>
  );
}

