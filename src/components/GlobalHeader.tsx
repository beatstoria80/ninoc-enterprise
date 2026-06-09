"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Search, ShoppingCart, User, X, Trash2, ShieldCheck, Plus, Minus, ArrowLeft, Truck } from 'lucide-react';
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);
  const scaleX = useSpring(0, { stiffness: 400, damping: 30 });

  useEffect(() => {
    scaleX.set(isHovered ? 1 : 0);
  }, [isHovered, scaleX]);

  return (
    <Link
      prefetch={false}
      href={href}
      className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink/50 hover:text-rose relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 rounded-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{children}</span>
      <motion.span
        className="absolute -bottom-2 left-0 right-0 h-[1px] bg-rose origin-left"
        style={{ scaleX }}
        transition={{ duration: DURATION.normal, ease: EASING.out }}
      />
    </Link>
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
          <p className="text-[8px] font-medium uppercase tracking-widest text-ink/30 italic">Ref: #{item.id.slice(0, 8)}</p>
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
            <div className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">Size {item.size || 'N/A'}</div>
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
            className="text-[10px] font-medium uppercase tracking-tight"
            animate={isHovered ? brandColor : darkColor}
            transition={{ duration: DURATION.fast }}
          >
            {product.name}
          </motion.h3>
          <motion.p
            className="text-[9px] font-medium text-ink/30 mt-0.5 italic"
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

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
        .select('avatar_url')
        .eq('user_id', userId)
        .single();
      if (data?.avatar_url) setProfileAvatar(data.avatar_url);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfileAvatar(null);
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

  return (
    <>
      {/* NAVIGATION BAR */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: DURATION.slow, ease: EASING.out }}
        className={cn(
          "fixed top-0 inset-x-0 z-[150] px-4 md:px-12 py-3 md:py-8 flex items-center justify-between transition-all duration-700",
          isScrolled ? "glass border-b border-ink/5 py-3 md:py-5" : "bg-transparent"
        )}
      >
        {/* Logo */}
        <motion.div className="relative flex flex-col">
          <PressScale className="cursor-pointer group flex flex-col">
            <Link prefetch={false} href="/" className="cursor-pointer group flex flex-col">
              <motion.div
                className="font-display font-medium text-3xl md:text-4xl italic tracking-tighter text-rose leading-none"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: DURATION.fast, ease: EASING.out }}
              >
                ninoc
              </motion.div>
            </Link>
          </PressScale>

          {/* Back navigation on inner pages */}
          <AnimatePresence>
            {((pathname.startsWith('/shop/') && pathname !== '/shop') || pathname === '/checkout' || pathname === '/cart') && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: DURATION.medium, ease: EASING.out }}
              >
                <Link prefetch={false} href="/shop" className="absolute top-full left-0 mt-8 hidden md:flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 hover:text-rose whitespace-nowrap group">
                  <motion.span animate={{ x: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: EASING.inOut }}>
                    <ArrowLeft size={10} />
                  </motion.span>
                  <span>RETURN TO CATALOG</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          className="hidden lg:flex items-center gap-16 absolute left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: DURATION.medium, ease: EASING.out }}
        >
          <NavLink href="/shop">{dict.header.shop}</NavLink>
          <NavLink href="/collections">Collections</NavLink>
          <NavLink href="/category">Category</NavLink>
          <NavLink href="/logbook">{dict.header.logbook}</NavLink>
          <NavLink href="/about">{dict.header.about}</NavLink>
        </motion.div>

        {/* Action Icons */}
        <motion.div
          className="flex items-center gap-6 md:gap-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: DURATION.medium, ease: EASING.out }}
        >
          {/* Language Toggle */}
          <div className="flex items-center gap-1.5 text-[8px] font-medium tracking-[0.2em]">
            <a href={lang === 'EN' ? (pathname.replace(/^\/en/, '') || '/') : pathname} className={cn("transition-colors cursor-pointer", lang !== 'EN' ? "text-ink" : "text-ink/20 hover:text-ink/60")}>
              ID
            </a>
            <span className="text-ink/10">|</span>
            <a href={lang === 'EN' ? pathname : `/en${pathname === '/' ? '' : pathname}`} className={cn("transition-colors cursor-pointer", lang === 'EN' ? "text-ink" : "text-ink/20 hover:text-ink/60")}>
              EN
            </a>
          </div>

          {/* Search Button */}
          <PressScale onClick={() => setIsSearchOpen(true)} className="text-ink/40 hover:text-rose">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Search size={20} strokeWidth={1.5} />
            </motion.div>
          </PressScale>

          {/* Tracking Button */}
          <PressScale className="text-ink/40 hover:text-rose">
            <Link prefetch={false} href="/track" className="flex items-center">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Truck size={20} strokeWidth={1.5} />
              </motion.div>
            </Link>
          </PressScale>

          {/* User Profile */}
          <PressScale className="text-ink/40 hover:text-rose">
            <Link prefetch={false} href={user ? "/profile" : "/login"} className="flex items-center">
              {profileAvatar ? (
                <motion.div
                  className="relative w-5 h-5"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: DURATION.fast }}
                >
                  <Image src={profileAvatar} alt="Profile" fill className="object-cover rounded-none border border-ink/5" />
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <User size={20} strokeWidth={1.5} />
                </motion.div>
              )}
            </Link>
          </PressScale>

          {/* Cart Button */}
          <PressScale onClick={() => setIsCartOpen(true)} className="relative group flex items-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="text-ink/40 group-hover:text-rose"
            >
              <ShoppingCart size={20} strokeWidth={1.5} />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={items.length}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose text-white text-[7px] font-medium flex items-center justify-center rounded-none border border-white shadow-sm"
            >
              {items.length}
            </motion.div>
          </PressScale>
        </motion.div>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CART OVERLAY — ASYMMETRIC 3-SECTOR ARCHIVAL INVENTORY */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.normal }}
            className="fixed inset-0 z-[300] bg-cr noise flex items-center justify-center overflow-auto">
            {/* Cart Content — centered max-width container */}
            <div className="w-full max-w-[1200px] h-full flex flex-col">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: DURATION.medium, ease: EASING.out }}
              className="px-4 md:px-10 py-3 md:py-6 flex items-center justify-between border-b border-ink/5"
            >
              <div className="flex items-center gap-4 md:gap-8">
                <motion.div
                  className="font-display font-medium text-3xl italic tracking-tighter text-rose uppercase"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: DURATION.medium }}
                >
                  Active Selection
                </motion.div>
                <motion.div
                  className="h-8 w-[1px] bg-ink/10 hidden md:block"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2, duration: DURATION.medium }}
                />
                <motion.div
                  className="hidden md:flex flex-col leading-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: DURATION.medium }}
                >
                  <span className="text-[8px] font-medium uppercase tracking-[0.4em] text-ink/30">Origin Studio</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-ink/60">{items.length} Units</span>
                </motion.div>
              </div>
              <PressScale onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center text-ink hover:bg-rose hover:text-white">
                <X size={14} />
              </PressScale>
            </motion.div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 h-full">

              {/* SECTOR 1: PRODUCT LIST */}
              <motion.div
                className="md:col-span-7 overflow-y-auto no-scrollbar border-r border-ink/5 px-3 md:px-6 py-3 md:py-6 space-y-3 md:space-y-4"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: DURATION.medium, ease: EASING.out }}
              >
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
                  <motion.div
                    className="h-full flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="text-ink/20">
                      <ShoppingCart size={36} />
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.4em]">Empty Selection</p>
                  </motion.div>
                )}
              </motion.div>

              {/* SECTOR 2: SUMMARY & CHECKOUT */}
              <motion.div
                className="md:col-span-5 px-3 md:px-6 py-3 md:py-6 bg-white flex flex-col"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: DURATION.medium, ease: EASING.out }}
              >
                {items.length > 0 && (
                  <motion.div
                    className="space-y-6 h-full flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: DURATION.medium }}
                  >
                    <div className="space-y-4">
                      <motion.p
                        className="text-[9px] font-medium uppercase tracking-[0.5em] text-ink/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        Total Summary
                      </motion.p>
                      <motion.div
                        className="space-y-3 border-b border-ink/5 pb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                          <span>Raw Value</span>
                          <span>IDR {totalPrice().toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80">
                          <span>Handling Fee</span>
                          <span className="text-emerald-600 italic">Complimentary</span>
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex flex-col items-center space-y-5 flex-1 justify-center">
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: DURATION.medium, ease: EASING.out }}
                      >
                        <span className="text-[9px] font-medium uppercase tracking-[0.6em] text-ink/30 block mb-2">Total</span>
                        <motion.span
                          className="text-2xl md:text-3xl font-display font-medium italic text-rose leading-none"
                          key={totalPrice()}
                          initial={{ scale: 1.1, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: DURATION.fast }}
                        >
                          IDR {totalPrice().toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </motion.span>
                      </motion.div>

                      <motion.div
                        className="w-full space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: DURATION.medium }}
                      >
                        <Link
                          href="/checkout"
                          onClick={() => setIsCartOpen(false)}
                          className="w-full bg-ink text-white py-3.5 font-medium text-[9px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2"
                        >
                          <motion.span
                            whileHover={{ x: 4 }}
                            transition={{ duration: DURATION.fast }}
                            className="flex items-center gap-3"
                          >
                            <span>Checkout</span>
                          </motion.span>
                        </Link>
                        <div
                          className="flex items-center justify-center gap-2 opacity-30 grayscale"
                        >
                          <ShieldCheck size={12} />
                          <span className="text-[7px] font-medium uppercase tracking-[0.2em]">Secure Transaction</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

            </div>
            </div>
          </motion.div>
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
                    <Search size={16} className="text-ink/30" />
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
                <PressScale onClick={() => setIsSearchOpen(false)} className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40 hover:text-rose flex items-center gap-2">
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
                              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/20">No matching items found</p>
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

      <ImageLightbox
        isOpen={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </>
  );
}
