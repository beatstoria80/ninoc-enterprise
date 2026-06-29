"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, Variants, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ShieldCheck, Paperclip, ChevronRight, ChevronDown, Grid3X3, ArrowRight, ShoppingCart } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { useCart } from '@/store/useCart';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CategoryType } from '@/types';
import DragSlider from '@/components/DragSlider';
import { useBrandColor } from '@/components/BrandProvider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM MODERN ICONS — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

// Pakaian (Apparel) — T-shirt icon
const PakaianIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
);

// Utilities (Functional) — Wrench/tool icon
const UtilitiesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>
);

// Aksesoris (Accents) — Diamond/gem icon
const AksesorisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 9L12 16L22 9L12 2Z" />
    <path d="M2 15L12 22L22 15" />
    <path d="M2 9V15L12 22V9" />
    <path d="M22 9V15L12 22V9" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// EMIL KOWALSKI ANIMATION ENGINE — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  springBounce: { type: "spring" as const, stiffness: 300, damping: 20 },
};

const DURATION = {
  micro: 0.05,
  fast: 0.08,
  normal: 0.12,
  medium: 0.18,
  slow: 0.3,
  hero: 0.5,
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'pakaian' as CategoryType, label: 'Pakaian', sublabel: 'Apparel', icon: PakaianIcon, href: '/shop?filter=Fashion', spec: 'GARMENT-001' },
  { id: 'utilities' as CategoryType, label: 'Utilities', sublabel: 'Functional', icon: UtilitiesIcon, href: '/shop?filter=Utilities', spec: 'UTIL-002' },
  { id: 'aksesoris' as CategoryType, label: 'Aksesoris', sublabel: 'Accents', icon: AksesorisIcon, href: '/shop?filter=Accessories', spec: 'ACCS-003' },
];

// ═══════════════════════════════════════════════════════════════
// VARIANT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const charVariants: Variants = {
  hidden: { y: 40, opacity: 0, filter: 'blur(8px)', scale: 1.05 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { delay: 0.1 + (i * 0.03), duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  }),
};

const productCardVariants: Variants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    y: 0, opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: DURATION.medium, ease: EASING.out },
  }),
};

const cardImageVariants: Variants = {
  hidden: { scale: 1.08, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: DURATION.slow, ease: EASING.out } },
};

const cardContentVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { delay: 0.15, duration: DURATION.medium, ease: EASING.out } },
};

const metadataVariants: Variants = {
  hidden: { y: 60, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    y: 0, opacity: 1, scale: 1,
    transition: { delay: 1.5 + i * 0.15, duration: 1.5, ease: [0.23, 1, 0.32, 1] },
  }),
};

const categoryPillVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, x: 0, scale: 1,
    transition: { delay: 0.4 + i * 0.1, duration: DURATION.medium, ease: EASING.out },
  }),
};

// ═══════════════════════════════════════════════════════════════
// PRESS SCALE BUTTON
// ═══════════════════════════════════════════════════════════════

function PressButton({ children, className = '', onClick, href, whileHover, whileTap }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  whileHover?: Parameters<typeof motion.div>[0]['whileHover'];
  whileTap?: Parameters<typeof motion.div>[0]['whileTap'];
}) {
  const inner = (
    <motion.div
      whileHover={whileHover as any}
      whileTap={whileTap as any}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      className={cn(className, "cursor-pointer")}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link  href={href}>{inner}</Link>;
  return (
    <button onClick={onClick} type="button" className="w-auto bg-transparent border-none p-0 m-0">
      {inner}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PORTRAIT CAROUSEL
// ═══════════════════════════════════════════════════════════════

const PORTRAIT_IMAGES = [
  "/banner_ninoc_1.png",
];
const CAROUSEL_INTERVAL = 150;

function PortraitImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const brandColor = useBrandColor();
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCycle = () => {
    setIsHovered(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    setCurrentIndex(0);
  };

  const startCycle = () => {
    if (PORTRAIT_IMAGES.length <= 1) return;
    setIsHovered(true);
    setCurrentIndex(0);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => { stopCycle(); }, 2000);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % PORTRAIT_IMAGES.length);
    }, CAROUSEL_INTERVAL);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0 0)' }}
      transition={{ delay: 0.2, duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
      className="aspect-[4/5] md:aspect-[3/4] bg-white overflow-hidden border border-ink/5 relative shadow-2xl shadow-ink/5"
      style={{ cursor: PORTRAIT_IMAGES.length > 1 ? 'pointer' : 'default' }}
    >
      <motion.div 
        initial={{ scale: 1.05, filter: 'blur(10px)' }} 
        animate={{ scale: 1, filter: 'blur(0px)' }} 
        transition={{ delay: 0.2, duration: 1.2, ease: [0.23, 1, 0.32, 1] }} 
        className="absolute inset-0 w-full h-full"
      >
      {PORTRAIT_IMAGES.map((src, i) => (
        <motion.div
          key={src}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentIndex === i ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASING.inOut }}
          style={{ zIndex: currentIndex === i ? 2 : 1 }}
        >
          <Image
            src={src}
            alt={`Archival Garment ${i + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-all duration-500 ${isHovered ? 'grayscale-0' : 'grayscale'}`}
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            priority={i === 0}
          />
        </motion.div>
      ))}
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-3 right-3 flex gap-1.5 z-20"
          >
            {PORTRAIT_IMAGES.map((_, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full"
                animate={{
                  backgroundColor: currentIndex === i ? brandColor.color : 'rgba(20,20,20,0.2)',
                  scale: currentIndex === i ? 1.4 : 1,
                }}
                transition={{ duration: 0.15, ease: EASING.out }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute top-2 left-1 bg-ink text-white px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-tighter z-20"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: DURATION.normal }}
      >
        SPEC-001
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-cr/20 to-transparent hidden md:block z-20" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: { id: string; name: string; price: number; image_url?: string; slug: string; category?: CategoryType; price_tag?: string | null };
  index: number;
}

function ProductCard({ product, index }: ProductCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };
  const { addItem } = useCart();
  const router = useRouter();

  const categoryInfo = CATEGORIES.find((c) => c.id === product.category);
  const CategoryIcon = categoryInfo?.icon || PakaianIcon;

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
  };

  return (
    <motion.div
      ref={ref}
      variants={productCardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={index}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full"
    >
      <PressButton href={`/shop/${product.slug}`} className="bg-white p-2 md:p-3 group relative overflow-hidden flex flex-col h-full border border-transparent hover:border-ink/5">
        <motion.div
          variants={cardImageVariants}
          className="aspect-[4/5] overflow-hidden mb-3.5 md:mb-4 relative bg-ink/5 border border-ink/5"
          animate={{ scale: isHovered ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              draggable={false}
              className="object-cover object-top transition-all duration-700 select-none pointer-events-none"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <CategoryIcon />
            </div>
          )}

          {/* Dynamic Badge (NEW / SALE) */}
          {(product.price_tag || index < 3) && (
            <motion.div
              className={cn(
                "absolute top-0 left-0 text-white px-2 py-1 text-[10px] uppercase tracking-widest z-10 font-bold",
                product.price_tag ? "bg-rose" : "bg-ink"
              )}
              animate={{ opacity: isHovered ? 0.9 : 1 }}
              transition={{ duration: DURATION.fast }}
            >
              {product.price_tag ? 'SALE' : 'NEW'}
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={cardContentVariants} className="flex flex-col flex-grow">
          <div className="space-y-0.5">
            <motion.p
              className="text-[9px] md:text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/50 leading-none"
              animate={{ opacity: isHovered ? 1 : 0.7 }}
              transition={{ duration: DURATION.fast }}
            >
              {categoryInfo?.label || 'Garment Origin'}
            </motion.p>

            <motion.h3
              className="text-[11px] md:text-xs font-display font-medium italic uppercase tracking-tighter line-clamp-2 leading-snug"
              animate={isHovered ? brandColor : darkColor}
              transition={{ duration: DURATION.fast }}
            >
              {product.name}
            </motion.h3>

          </div>

          <div className="mt-auto pt-1 border-t border-ink/5 space-y-1.5">
            {product.price_tag && (
              <div className="flex items-center gap-1 border border-rose/20 px-1 py-0.5 bg-rose/[0.02] w-fit">
                <span className="text-[6px] md:text-[7px] font-medium text-rose uppercase tracking-widest flex items-center gap-0.5">
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {product.price_tag}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <motion.p
                className="text-xs md:text-[12px] font-display font-medium italic text-ink whitespace-nowrap leading-none"
                animate={{ scale: isHovered ? 1.02 : 1 }}
                transition={{ duration: DURATION.fast }}
              >
                IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </motion.p>

              <div className="flex gap-1.5 relative z-10">
                <motion.div
                  role="button"
                  tabIndex={0}
                  onClick={handleQuickBuy}
                  className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: DURATION.fast, ease: EASING.out }}
                >
                  <ShoppingCart className="w-4 h-4" />
                </motion.div>
                <motion.div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    // Allow the link click to happen since it's wrapped in PressButton (a)
                    // but we might want to prevent drag issues
                  }}
                  className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center transition-colors duration-200 cursor-pointer"
                  style={{ backgroundColor: isHovered ? brandColor.color : 'rgba(20,20,20,0.05)' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: DURATION.fast, ease: EASING.out }}
                >
                  <motion.div
                    animate={{ x: isHovered ? 2 : 0, color: isHovered ? '#ffffff' : '#141414' }}
                    transition={{ duration: DURATION.fast, ease: EASING.out }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </PressButton>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY QUICK ACCESS — Desktop Only
// ═══════════════════════════════════════════════════════════════

function CategoryQuickAccess() {
  return (
    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
      {CATEGORIES.map((cat, i) => {
        const Icon = cat.icon;
        return (
          <motion.div
            key={cat.id}
            variants={categoryPillVariants}
            initial="hidden"
            animate="visible"
            custom={i}
          >
            <PressButton
              href={cat.href}
              className="flex items-center gap-4 bg-white border border-ink/10 px-6 py-4 group whitespace-nowrap rounded-none hover:border-rose hover:bg-rose transition-all duration-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center bg-ink/5 rounded-none group-hover:bg-white/20 transition-colors duration-200"
              >
                <div
                  className="text-ink group-hover:text-white transition-colors duration-200"
                >
                  <Icon />
                </div>
              </div>

              <div className="flex flex-col leading-none gap-0.5">
                <span
                  className="text-base font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-white transition-colors duration-200"
                >
                  {cat.label}
                </span>
                <span
                  className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/50 group-hover:text-white/70 transition-colors duration-200"
                >
                  {cat.sublabel}
                </span>
              </div>

              <div
                className="ml-2 opacity-40 group-hover:opacity-90 group-hover:text-white group-hover:translate-x-1 transition-all duration-200"
              >
                <ArrowRight size={14} />
              </div>
            </PressButton>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FADE-UP SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════

function FadeUpSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: DURATION.medium, delay, ease: EASING.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════

interface Product {
  id: string; name: string; price: number; image_url?: string; slug: string; category?: CategoryType; price_tag?: string | null;
}



// ═══════════════════════════════════════════════════════════════
// HERO SEQUENCE (MORPHING)
// ═══════════════════════════════════════════════════════════════

function HeroSequence({ dict, isReturningVisitor, scene }: any) {
  const [heroState, setHeroState] = useState<'intro' | 'expanded'>(isReturningVisitor ? 'expanded' : 'intro');

  useEffect(() => {
    if (scene === 'archive' && heroState === 'intro') {
      const timer = setTimeout(() => {
        setHeroState('expanded');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [scene, heroState]);

  return (
    <div className="relative w-full overflow-hidden bg-white border-b border-ink/5 min-h-[260px] md:min-h-[30vw] lg:min-h-[28vw] 2xl:min-h-[520px]">
      <AnimatePresence>
        {heroState === 'intro' ? (
          <motion.section 
            key="intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASING.inOut }}
            className="relative md:pt-16 pt-2 pb-0 px-4 md:px-12 max-w-[1800px] mx-auto"
          >
            <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center lg:items-start">

              {/* Left: Branding */}
              <div className="lg:col-span-4 space-y-2.5 md:space-y-4 lg:pt-24">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-2 text-rose"
                >
                  <Paperclip className="w-3 h-3 md:w-[18px] md:h-[18px]" />
                  <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.15em] md:tracking-widest whitespace-nowrap">Origin Specification</span>
                </motion.div>

                <h1 className="text-3xl md:text-5xl lg:text-7xl font-display font-medium italic tracking-tighter text-ink leading-[0.9] uppercase">
                  {"NINOC STORE".split(" ").map((word: string, wi: number) => (
                    <span key={word + wi} className="block overflow-hidden">
                      {word.split("").map((char: string, ci: number) => (
                        <motion.span key={ci} variants={charVariants} initial="hidden" animate="visible" custom={wi * 8 + ci} className="inline-block">
                          {char}
                        </motion.span>
                      ))}
                    </span>
                  ))}
                </h1>

                <motion.p
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="text-[11px] md:text-sm font-medium leading-snug md:leading-relaxed text-ink/60 md:text-ink/60 max-w-[260px] md:max-w-sm uppercase tracking-tight md:tracking-wider"
                >
                  {dict.home.heroSubtitle} <span className="hidden md:inline">{dict.home.craftDesc}</span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, x: -30, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.6, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                >
                  <PressButton href="/shop" className="group inline-flex items-center gap-2 text-ink">
                    <span className="md:hidden inline-flex items-center gap-1.5 bg-ink/5 px-3 py-1.5 border border-ink/10">
                      <span className="text-xs md:text-[7px] font-medium uppercase tracking-[0.2em]">Catalog</span>
                      <ArrowRight size={10} className="text-rose group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="hidden md:inline text-sm md:text-[11px] font-medium uppercase tracking-[0.4em]">Browse Category</span>
                    <div className="hidden md:inline relative w-12 h-[1px] overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-ink/20"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1, duration: DURATION.slow, ease: EASING.out }}
                        style={{ originX: 0 }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-rose origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: DURATION.fast, ease: EASING.out }}
                      />
                      <motion.span
                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        whileHover={{ x: 4 }}
                        transition={{ duration: DURATION.fast, ease: EASING.out }}
                      >
                        <ChevronRight className="w-3 h-3 text-rose" />
                      </motion.span>
                    </div>
                  </PressButton>
                </motion.div>

                {/* Mobile Metadata */}
                <div className="flex items-center gap-4 mt-4 md:hidden">
                  {[
                    { label: 'year', value: '2024' },
                    { label: 'loc', value: 'bdg, id' },
                    { label: 'phil', value: 'simplicity' }
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      className="flex flex-col items-start text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <p className="text-[8px] font-normal tracking-[0.15em] text-ink/25 leading-none mb-1 lowercase">{item.label}</p>
                      <p className="text-[10px] font-medium text-ink/50 lowercase leading-none tracking-wide whitespace-nowrap">{item.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Middle: Portrait — cinematic one-shot reveal (Emil: no infinite decorative animations) */}
              <div className="lg:col-span-4 relative mt-0 z-50">
                <motion.div
                  transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  className="aspect-[4/4] md:aspect-[3/4] lg:aspect-[4/5] bg-white overflow-hidden relative shadow-2xl shadow-ink/5 border border-ink/5"
                >
                  {/* Cinematic reveal: clip-path wipe from bottom + scale + blur — one-shot only */}
                  <motion.div
                    initial={{ 
                      clipPath: 'inset(0 0 100% 0)',
                      scale: 1.08,
                      filter: 'blur(8px)'
                    }}
                    animate={{ 
                      clipPath: 'inset(0 0 0% 0)',
                      scale: 1,
                      filter: 'blur(0px)'
                    }}
                    transition={{ 
                      duration: 1.4, 
                      ease: [0.23, 1, 0.32, 1],
                      delay: 0.15
                    }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <Image src="/banner_ninoc_1.png" alt="NINOC Intro" fill sizes="100vw" className="object-cover object-top" priority />
                  </motion.div>

                  {/* SPEC label */}
                  <motion.div
                    className="absolute top-2 left-1 bg-ink text-white px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-tighter z-20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: DURATION.normal }}
                  >
                    SPEC-001
                  </motion.div>
                </motion.div>

                {/* Technical Detail card */}
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute -bottom-8 -right-8 bg-white p-6 rounded-none border border-ink/5 shadow-xl hidden md:block z-30"
                >
                  <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.3em] text-ink/50 mb-2">Technical Detail</p>
                  <p className="text-xs md:text-[10px] font-medium text-ink uppercase">Hand-stitched precision<br />Industrial Grade Fabrics</p>
                </motion.div>
              </div>

              {/* Right: Metadata Sidebar */}
              <div className="col-span-2 lg:col-span-4 lg:pt-20 -mt-10 md:mt-0 lg:mt-0">
                <div className="hidden md:flex flex-col space-y-3 border-l border-ink/5 pl-8">
                  {[{ label: 'Year', value: 'Est. 2024' }, { label: 'Location', value: 'Bandung, Indonesia' }, { label: 'Philosophy', value: '"Functionality through absolute simplicity."' }].map((item, i) => (
                    <motion.div key={item.label} className="space-y-0" variants={metadataVariants} initial="hidden" animate="visible" custom={i}>
                      <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/20">{item.label}</p>
                      <p className={`text-xs md:text-[10px] font-medium text-ink ${i === 2 ? 'italic leading-tight' : ''}`}>{item.value}</p>
                    </motion.div>
                  ))}

                  {/* Origin Verified card */}
                  <motion.div
                    className="bg-ink text-white p-8 rounded-none space-y-6 hidden lg:block mt-8"
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-rose">
                        <ShieldCheck size={18} />
                      </div>
                      <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest">Origin Verified</span>
                    </div>
                    <div className="text-sm md:text-[11px] font-medium uppercase leading-loose tracking-widest !text-white !opacity-100">Not just clothing. These are artifacts born from the streets, the stage, and the culture that shaped who we are.</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section 
            key="expanded"
            className="absolute inset-0 w-full overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Banner Image Target */}
            <motion.div
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <Image src="/banner_ninoc_1.png" alt="NINOC STORE" fill sizes="100vw" className="object-cover object-top" priority />
            </motion.div>

            {/* Subtle gradient */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent z-10" 
            />

            {/* Overlay Text */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8 lg:p-12"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 max-w-[1800px] mx-auto h-full relative">
                {/* Centered Browse Catalog Button */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto">
                  <PressButton href="/shop" className="group inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-6 py-3 border border-white/20 text-white hover:bg-white hover:text-ink transition-all duration-300">
                      <span className="text-[8px] md:text-xs font-medium uppercase tracking-[0.3em]">catalog</span>
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </PressButton>
                </div>

                {/* Empty left space placeholder to push metadata to the right */}
                <div className="flex-1"></div>
                
                {/* Right Metadata Desktop Only */}
                <div className="hidden md:flex items-end gap-6 lg:gap-8">
                  {[
                    { label: 'Year', value: 'Est. 2024' },
                    { label: 'Location', value: 'Bandung, ID' },
                    { label: 'Philosophy', value: 'Simplicity' }
                  ].map((item, i) => (
                    <div key={item.label} className="text-right">
                      <p className="text-[7px] font-medium uppercase tracking-widest text-white/35 mb-0.5">{item.label}</p>
                      <p className="text-[9px] font-medium text-white/70 uppercase tracking-wide">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const pathname = usePathname();
  const lang: Locale = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(lang);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const [scene, setScene] = useState<'hero' | 'transitioning' | 'archive'>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('ninoc_intro_played') === 'true') {
      return 'archive';
    }
    return 'hero';
  });
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [isReturningVisitor, setIsReturningVisitor] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('ninoc_intro_played') === 'true') {
      return true;
    }
    return false;
  });
  
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });
  const videoScale = useTransform(smoothProgress, [0, 1], [1, 1.05]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('*, variants(*)').limit(8);
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Prevent scrolling during hero scene and hide mobile nav
  useEffect(() => {
    if (scene === 'hero') {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      window.dispatchEvent(new CustomEvent('hide-mobile-nav'));
    } else {
      document.body.style.overflow = 'auto';
      window.dispatchEvent(new CustomEvent('show-mobile-nav'));
    }
    return () => { 
      document.body.style.overflow = 'auto'; 
      window.dispatchEvent(new CustomEvent('show-mobile-nav'));
    };
  }, [scene]);

  // Listen for replay-opening event (when Home tab is tapped again)
  useEffect(() => {
    const handleReplay = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('replay-opening', handleReplay);
    return () => window.removeEventListener('replay-opening', handleReplay);
  }, []);

  // Listen for skip-intro event to bypass the intro video immediately
  useEffect(() => {
    const handleSkip = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ninoc_intro_played', 'true');
      }
      setScene('archive');
      setIsReturningVisitor(true);
    };
    window.addEventListener('skip-intro', handleSkip);
    return () => window.removeEventListener('skip-intro', handleSkip);
  }, []);

  const handleShopClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ninoc_intro_played', 'true');
    }
    setScene('transitioning');
    setTimeout(() => {
      setScene('archive');
    }, 1200);
  };

  return (
    <div className="bg-ink relative min-h-screen overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCENE 01: HERO VIDEO BANNER                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {(scene === 'hero' || scene === 'transitioning') && (
          <motion.div 
            className="fixed inset-0 z-[200] bg-ink overflow-hidden h-[100dvh]"
            initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            animate={
              scene === 'transitioning' 
                ? { scale: 0.92, opacity: 0, filter: 'blur(10px)', y: -40 } // Cinematic zoom out, blur & fade
                : { scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 }
            }
            transition={{ duration: 1.2, ease: EASING.inOut }} // Smooth transition
          >
            {/* Cinematic Video Background */}
            <motion.video 
              autoPlay 
              loop 
              muted 
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover opacity-80 bg-ink"
              style={{ scale: videoScale }}
            >
              <source src="/videos/opening_video_ninoc.mp4" type="video/mp4" />
            </motion.video>
            
            {/* Minimal UI Overlay */}
            <div className="absolute inset-0 h-full flex flex-col justify-between p-6 md:p-12 z-10 text-white">
              {/* Header area */}
              <div className="flex justify-between items-center w-full">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.2 }}>
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
                
                <motion.div className="hidden md:flex gap-8 text-xs md:text-[10px] font-medium uppercase tracking-[0.2em]" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.3 }}>
                  <span>Catalog</span>
                  <span>Collections</span>
                  <span>Category</span>
                  <span>Logbook</span>
                  <span>About Us</span>
                </motion.div>
                
                <motion.div className="flex gap-4 text-xs md:text-[10px] font-medium uppercase tracking-[0.2em]" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.4 }}>
                  <span>Search</span>
                  <span className="hidden md:inline">Account</span>
                  <span>Cart(0)</span>
                </motion.div>
              </div>

              {/* Center Content - Moved to bottom with safe-area padding for mobile browsers */}
              <div className="flex flex-col items-center justify-end flex-grow text-center pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-24">
                
                {/* Scene 02: SHOP Button Interaction */}
                <motion.button
                  onClick={handleShopClick}
                  className="bg-white text-ink px-10 py-4 text-sm font-medium uppercase tracking-[0.3em] transition-all relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: [1, 1.05, 1],
                    boxShadow: ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 20px rgba(255,255,255,0.4)", "0px 0px 0px rgba(255,255,255,0)"]
                  }}
                  transition={{
                    opacity: { duration: 1, delay: 0.5 },
                    y: { duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.5 },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
                  }}
                  whileHover={{ scale: 1.1, backgroundColor: "#f8f8f8" }}
                  whileTap={{ scale: 0.97 }} // Emil's principle
                  style={{ transitionProperty: "background-color" }}
                >
                  SHOP NOW
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCENE 04 & 05: PRODUCT ARCHIVE & SCROLL EXPERIENCE            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {(scene === 'archive' || scene === 'transitioning') && (
          <motion.div
            className="w-full min-h-screen bg-white relative z-40"
            initial={isReturningVisitor ? false : { opacity: 0, scale: 0.95, y: 60 }}
            animate={{ 
              opacity: scene === 'archive' || scene === 'transitioning' ? 1 : 0,
              scale: scene === 'archive' || scene === 'transitioning' ? 1 : 0.95,
              y: scene === 'archive' || scene === 'transitioning' ? 0 : 60 
            }}
            transition={{ duration: isReturningVisitor ? 0.3 : 1.2, ease: EASING.inOut, delay: isReturningVisitor ? 0 : 0.1 }} // Cinematic scale up and reveal
          >
             {/* ORIGINAL HOME PAGE CONTENT WRAPPED IN ARCHIVE SCENE */}
             <div className="mobile-momentum select-none">

      <HeroSequence dict={dict} isReturningVisitor={isReturningVisitor} scene={scene} />

      {/* CATALOG & CATEGORY DROPDOWN */}
      <section id="archive-catalog" className="mt-1 md:mt-2 lg:mt-1 px-4 md:px-12 max-w-[1800px] mx-auto min-h-screen">

        <div className="relative -mx-4 md:mx-0">
          <DragSlider className="flex gap-px w-full">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-[45vw] md:w-[160px] aspect-[4/5] bg-white animate-pulse flex-shrink-0"
                />
              ))
            ) : (
              products.map((product, i) => (
                <div key={product.id} className="w-[45vw] md:w-[160px] lg:w-[170px] xl:w-[190px] 2xl:w-[200px] flex-shrink-0">
                  <ProductCard product={product} index={i} />
                </div>
              ))
            )}
          </DragSlider>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block z-10" />
        </div>
      </section>

      {/* CONNECT SECTION */}
      <FadeUpSection delay={0.1}>
        <section className="px-4 md:px-12 max-w-[1800px] mx-auto mb-6 md:mb-16">
          <div className="bg-white border border-ink/5 p-4 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

              {/* Instagram */}
              <a
                href="https://www.instagram.com/ninoc.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
              >
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4"
                  whileHover={{ backgroundColor: 'rgba(232, 82, 122, 0.1)', scale: 1.05 }}
                  transition={{ duration: DURATION.fast }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </motion.div>
                <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/60 mb-1">Follow Us</p>
                <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">@ninoc.store</p>
                <p className="text-xs md:text-[7px] text-ink/50 uppercase tracking-widest mt-1">Instagram</p>
              </a>

              {/* Email */}
              <a
                href="mailto:beatstoria.ai@gmail.com"
                className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
              >
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4"
                  whileHover={{ backgroundColor: 'rgba(232, 82, 122, 0.1)', scale: 1.05 }}
                  transition={{ duration: DURATION.fast }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </motion.div>
                <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/60 mb-1">Email Us</p>
                <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">beatstoria.ai@gmail.com</p>
                <p className="text-xs md:text-[7px] text-ink/50 uppercase tracking-widest mt-1">Direct Message</p>
              </a>

              {/* Phone / WhatsApp */}
              <a
                href="https://wa.me/628211983774"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
              >
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4"
                  whileHover={{ backgroundColor: 'rgba(232, 82, 122, 0.1)', scale: 1.05 }}
                  transition={{ duration: DURATION.fast }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-rose">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </motion.div>
                <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/60 mb-1">WhatsApp</p>
                <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">+62 8211983774</p>
                <p className="text-xs md:text-[7px] text-ink/50 uppercase tracking-widest mt-1">Chat Now</p>
              </a>

            </div>

            {/* Bottom CTA */}
            <div className="mt-8 pt-6 border-t border-ink/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.4em] text-rose">NINOC ENTERPRISE</p>
                <p className="text-base md:text-xs font-display font-medium italic text-ink mt-0.5">Wear the art, own the day.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/about" className="px-5 py-2.5 bg-rose text-white text-sm md:text-[9px] font-semibold uppercase tracking-widest hover:bg-rose/90 transition-colors">
                  About NINOC
                </Link>
                <Link href="/shop" className="px-5 py-2.5 border border-ink/10 text-ink/50 text-[10px] md:text-[9px] font-semibold uppercase tracking-widest hover:border-ink/20 hover:text-ink transition-colors">
                  catalog
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeUpSection>
    </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
