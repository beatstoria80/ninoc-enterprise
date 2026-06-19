"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Search, ShoppingCart, User, X, Trash2, ShieldCheck, Plus, Minus, ArrowLeft, Truck, MoreVertical, LogOut } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/store/useCart';
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
  micro: 0.1,    // 100ms - button press feedback
  fast: 0.15,    // 150ms - small hover
  normal: 0.2,   // 200ms - standard transitions
  medium: 0.3,   // 300ms - modals, drawers
  slow: 0.5,     // 500ms - page transitions
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
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      onClick={onClick}
      disabled={disabled}
      className={className}
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
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      onClick={onClick}
      disabled={disabled}
      className={cn(className, "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 rounded-md")}
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

  useEffect(() => {
    scaleX.set(isHovered ? 1 : 0);
  }, [isHovered, scaleX]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (index * 0.05), duration: DURATION.medium, ease: EASING.out }}
    >
      <Link
        prefetch={false}
        href={href}
        className={cn(
          "text-sm md:text-[11px] font-medium uppercase tracking-[0.3em] relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 rounded-md transition-colors block",
          isDark ? "text-white/80 hover:text-white" : "text-ink/50 hover:text-rose"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.span whileTap={{ scale: 0.97 }} className="inline-block transition-transform duration-100 ease-out">{children}</motion.span>
        <motion.span
          className={cn("absolute -bottom-2 left-0 right-0 h-[1px] origin-left", isDark ? "bg-white" : "bg-rose")}
          style={{ scaleX }}
        />
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAGGERED CART ITEM
// ═══════════════════════════════════════════════════════════════

function CartItem({
  item,
  index,
  onRemove,
  onQuantityChange,
  onImageClick
}: {
  item: { id: string; name: string; price: number; quantity: number; size?: string; image_url?: string | null };
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
        {item.image_url && (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-contain p-2 transition-all duration-700"
            style={{
              filter: isHovered ? 'grayscale(0%)' : 'grayscale(0%)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        )}
        {/* Remove button overlay */}
        <motion.button
          onClick={onRemove}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: DURATION.fast }}
          className="absolute inset-0 bg-ink/20 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-8 h-8 bg-rose flex items-center justify-center"
          >
            <Trash2 size={14} className="text-white" />
          </motion.div>
        </motion.button>
      </motion.div>

      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <motion.h3
              className="text-xs font-display font-medium italic uppercase tracking-tight"
              animate={isHovered ? brandColor : darkColor}
              transition={{ duration: DURATION.fast }}
            >
              {item.name}
            </motion.h3>
          </div>
          <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/30 italic">Ref: #{item.id.slice(0, 8)}</p>
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
              <PressScale onClick={() => onQuantityChange(1)} className="text-ink/50 hover:text-rose p-0.5">
                <Plus size={12} strokeWidth={2} />
              </PressScale>
            </motion.div>
            <div className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">Size {item.size || 'N/A'}</div>
          </div>
          <motion.div
            className="text-sm font-display font-medium italic text-rose"
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
            className="text-xs md:text-[9px] font-medium text-ink/30 mt-0.5 italic"
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
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Search debounce
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
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
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: DURATION.slow, ease: EASING.out }}
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
          className={cn(
            "fixed top-0 inset-x-0 z-[150] px-3 md:px-12 flex items-center justify-between transition-all duration-700",
            (isScrolled || isHeaderHovered) ? "glass border-b border-ink/5 py-3 md:py-5" : "bg-gradient-to-b from-white/90 via-white/50 to-transparent py-3 md:py-8"
          )}
        >
          <div className="flex items-center gap-1 md:gap-5">
            {/* Drawer Menu Toggle (3 Dots) */}
          <PressScale 
            onClick={() => setIsMenuOpen(true)} 
            className={cn("transition-colors cursor-pointer p-2 -ml-1 md:-m-2", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}
          >
            <MoreVertical size={20} strokeWidth={1.5} />
          </PressScale>

          {/* Logo */}
          <motion.div className="relative flex flex-col">
            <Link prefetch={false} href="/" className="cursor-pointer group flex flex-col focus:outline-none rounded-sm">
              <motion.div
                className={cn("font-display font-medium text-2xl md:text-3xl italic tracking-tighter leading-none transition-colors duration-500", isDarkBg ? "text-white" : "text-rose")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97, filter: "blur(2px)", opacity: 0.7 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              >
                ninoc
              </motion.div>
            </Link>

          {/* Back navigation on inner pages */}
          <AnimatePresence>
            {((pathname.startsWith('/shop/') && pathname !== '/shop') || pathname === '/checkout') && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: DURATION.medium, ease: EASING.out }}
              >
                <Link prefetch={false} href="/shop" className={cn("absolute top-full left-0 mt-8 hidden md:flex items-center gap-1 text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] whitespace-nowrap group transition-colors", isDarkBg ? "text-white hover:text-white/80" : "text-ink hover:text-rose")}>
                  <motion.span animate={{ x: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: EASING.inOut }}>
                    <ArrowLeft size={10} />
                  </motion.span>
                  <span>RETURN TO CATALOG</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>

        {/* Navigation Links - Hidden on mobile, shown on lg */}
        <motion.div
          className="hidden lg:flex items-center gap-16 absolute left-1/2 -translate-x-1/2"
        >
          <NavLink index={0} isDark={isDarkBg} href="/shop">{dict.header.shop}</NavLink>
          <NavLink index={1} isDark={isDarkBg} href="/collections">{dict.header.collections}</NavLink>
          <NavLink index={2} isDark={isDarkBg} href="/category">{dict.header.category}</NavLink>
          <NavLink index={3} isDark={isDarkBg} href="/logbook">{dict.header.logbook}</NavLink>
          <NavLink index={4} isDark={isDarkBg} href="/about">{dict.header.about}</NavLink>
        </motion.div>

        {/* Action Icons */}
        <motion.div
          className="flex items-center gap-5 md:gap-7"
        >
          {/* Language Toggle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: DURATION.fast }}
            className={cn("flex items-center gap-1.5 text-[10px] md:text-[9px] font-semibold tracking-[0.15em] px-2.5 py-1.5 rounded-full border transition-colors", isDarkBg ? "border-white/15" : "border-ink/10")}
          >
            <a href={lang === 'EN' ? (pathname.replace(/^\/en/, '') || '/') : pathname} className={cn("transition-colors cursor-pointer", lang !== 'EN' ? (isDarkBg ? "text-white" : "text-ink") : (isDarkBg ? "text-white/40 hover:text-white" : "text-ink/30 hover:text-ink"))}>
              ID
            </a>
            <span className={isDarkBg ? "text-white/20" : "text-ink/10"}>·</span>
            <a href={lang === 'EN' ? pathname : `/en${pathname === '/' ? '' : pathname}`} className={cn("transition-colors cursor-pointer", lang === 'EN' ? (isDarkBg ? "text-white" : "text-ink") : (isDarkBg ? "text-white/40 hover:text-white" : "text-ink/30 hover:text-ink"))}>
              EN
            </a>
          </motion.div>

          {/* Separator */}
          <div className={cn("w-px h-4 hidden md:block", isDarkBg ? "bg-white/15" : "bg-ink/10")} />

          {/* Search Button */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, duration: DURATION.fast }}>
            <PressScale onClick={() => setIsSearchOpen(true)} className={cn("transition-colors p-2 -m-2", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}>
              <Search size={18} strokeWidth={1.5} />
            </PressScale>
          </motion.div>

          {/* Tracking Button */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: DURATION.fast }}>
            <PressScale className={cn("transition-colors p-2 -m-2", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}>
              <Link prefetch={false} href="/track" className="flex items-center">
                <Truck size={18} strokeWidth={1.5} />
              </Link>
            </PressScale>
          </motion.div>

          {/* User Profile */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, duration: DURATION.fast }}>
            <PressScale className={cn("transition-colors p-2 -m-2", isDarkBg ? "text-white hover:text-white/80" : "text-ink/70 hover:text-rose")}>
              <Link prefetch={false} href={user ? "/profile" : "/login"} className="flex items-center">
                {profileAvatar ? (
                  <div className="relative w-[22px] h-[22px]">
                    <Image src={profileAvatar} alt="Profile" fill className={cn("object-cover rounded-full border-[1.5px] shadow-sm", isDarkBg ? "border-white/30" : "border-rose/20")} />
                  </div>
                ) : user ? (
                  <div className={cn("w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold border-[1.5px]", isDarkBg ? "bg-white/15 text-white border-white/20" : "bg-rose/8 text-rose border-rose/15")}>
                    {profileName ? profileName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                ) : (
                  <User size={18} strokeWidth={1.5} />
                )}
              </Link>
            </PressScale>
          </motion.div>

          {/* Cart Button */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: DURATION.fast }}>
            <PressScale onClick={() => setIsCartOpen(true)} className="relative group flex items-center p-2 -m-2">
              <div className={cn("transition-colors", isDarkBg ? "text-white group-hover:text-white/80" : "text-ink/70 group-hover:text-rose")}>
                <ShoppingCart size={18} strokeWidth={1.5} />
              </div>
              <AnimatePresence>
                {items.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: DURATION.micro, ease: EASING.out }}
                    key={items.length}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-rose text-white text-[8px] font-semibold flex items-center justify-center rounded-full shadow-sm"
                  >
                    {items.length}
                  </motion.div>
                )}
              </AnimatePresence>
            </PressScale>
          </motion.div>
        </motion.div>
      </motion.nav>
      ) : (
        <div className="fixed top-0 inset-x-0 z-[150] px-3 md:px-6 pt-3 md:pt-4 pb-6 flex items-start justify-between pointer-events-none">
          <div className="pointer-events-auto -ml-1">
            <PressScale 
              onClick={() => setIsMenuOpen(true)} 
              className="text-ink/60 hover:text-rose transition-colors cursor-pointer block p-1"
            >
              <MoreVertical size={20} strokeWidth={1.5} />
            </PressScale>
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5 text-[10px] md:text-[9px] font-semibold tracking-[0.15em] text-ink/60 mt-1 px-2.5 py-1.5 rounded-full border border-ink/10">
            <a href={lang === 'EN' ? ((pathname as string).replace(/^\/en/, '') || '/') : pathname} className={cn("transition-colors cursor-pointer hover:text-ink", lang !== 'EN' ? "text-ink font-bold" : "text-ink/30")}>
              ID
            </a>
            <span className="text-ink/10">·</span>
            <a href={lang === 'EN' ? pathname : `/en${(pathname as string) === '/' ? '' : pathname}`} className={cn("transition-colors cursor-pointer hover:text-ink", lang === 'EN' ? "text-ink font-bold" : "text-ink/30")}>
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
                  <span className="text-[10px] font-medium uppercase tracking-widest text-ink/60">{items.length} Units</span>
                </div>
                <PressScale onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center text-ink hover:bg-rose hover:text-white">
                  <X size={14} />
                </PressScale>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-4">
                {items.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <CartItem
                        key={`${item.id}-${item.size}`}
                        item={item}
                        index={index}
                        onRemove={() => removeItem(item.id, item.size)}
                        onQuantityChange={(delta) => updateQuantity(item.id, item.quantity + delta, item.size)}
                        onImageClick={() => item.image_url && setFullscreenImage(item.image_url)}
                      />
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 my-auto py-12">
                    <div className="text-ink/20">
                      <ShoppingCart size={48} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.4em]">Empty Selection</p>
                      <p className="text-[10px] text-ink/40 tracking-wider">Your cart is currently empty.</p>
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
              {items.length > 0 && (
                <div className="px-6 py-6 border-t border-ink/5 bg-white space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                      <span>Raw Value</span>
                      <span>IDR {totalPrice().toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                      <span>Handling Fee</span>
                      <span className="text-emerald-600 italic">Complimentary</span>
                    </div>
                    <div className="h-[1px] bg-ink/5 my-2" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">Total</span>
                      <span className="text-xl font-display font-medium italic text-rose">
                        IDR {totalPrice().toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                    <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
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
                <PressScale onClick={() => setIsSearchOpen(false)} className="text-xs md:text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40 hover:text-rose flex items-center gap-2">
                  Close
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
                    className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-ink/5 max-h-[400px] overflow-y-auto"
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
              className="fixed top-0 left-0 w-[85vw] max-w-[400px] h-auto max-h-[85vh] bg-cr noise z-[410] border-r border-b border-ink/5 shadow-2xl flex flex-col rounded-br-3xl overflow-hidden"
            >
              <div className="px-6 md:px-10 py-6 border-b border-ink/5 flex items-center justify-between shrink-0">
                <div className="font-display font-medium text-3xl italic tracking-tighter text-rose">
                  ninoc
                </div>
                <PressScale onClick={() => setIsMenuOpen(false)} className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center text-ink hover:bg-rose hover:text-white">
                  <X size={14} />
                </PressScale>
              </div>

              <div className="overflow-y-auto px-6 md:px-10 py-8 flex flex-col gap-6">
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
                      <span className="text-[11px] md:text-[8px] font-medium text-ink/40 truncate">
                        {user.email}
                      </span>
                    </div>
                  </motion.div>
                )}

                {[
                  { label: dict.header.shop, href: '/shop' },
                  { label: dict.header.collections, href: '/collections' },
                  { label: dict.header.category, href: '/category' },
                  { label: dict.header.affiliate, href: '/affiliate' },
                  { label: dict.header.logbook, href: '/logbook' },
                  { label: 'Supplier', href: '/supplier/apply' },
                  { label: dict.header.shippingTerms, href: '/help/shipping-payment' },
                  { label: dict.header.about, href: '/about' }
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (idx * 0.05), duration: DURATION.medium, ease: EASING.out }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-sm md:text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-ink/70 hover:text-rose transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

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
                <p className="text-xs md:text-[9px] font-medium uppercase tracking-[0.2em] text-ink/30 mb-3">Language</p>
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
