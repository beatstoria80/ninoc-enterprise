"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, Variants, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Package, Paperclip, ChevronRight, Grid3X3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CategoryType } from '@/types';
import DragSlider from '@/components/DragSlider';
import { useBrandColor } from '@/components/BrandProvider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  micro: 0.1,
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
  hero: 0.8,
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'pakaian' as CategoryType, label: 'Pakaian', sublabel: 'Apparel', icon: PakaianIcon, href: '/category?cat=pakaian', spec: 'GARMENT-001' },
  { id: 'utilities' as CategoryType, label: 'Utilities', sublabel: 'Functional', icon: UtilitiesIcon, href: '/category?cat=utilities', spec: 'UTIL-002' },
  { id: 'aksesoris' as CategoryType, label: 'Aksesoris', sublabel: 'Accents', icon: AksesorisIcon, href: '/category?cat=aksesoris', spec: 'ACCS-003' },
];

// ═══════════════════════════════════════════════════════════════
// VARIANT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const wordVariants: Variants = {
  hidden: { y: 60, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.12, duration: DURATION.hero, ease: EASING.out },
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

const trustIconVariants: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: (i: number) => ({
    scale: 1, opacity: 1,
    transition: { delay: i * 0.12, duration: DURATION.medium, ease: [0.34, 1.56, 0.64, 1], type: 'spring' as const },
  }),
};

const metadataVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: (i: number) => ({
    y: 0, opacity: 1,
    transition: { delay: 0.25 + i * 0.1, duration: DURATION.medium, ease: EASING.out },
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

  if (href) return <Link prefetch={false} href={href}>{inner}</Link>;
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
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop",
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DURATION.slow, ease: EASING.out }}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
      className="aspect-[3/4] md:aspect-[4/5] bg-white overflow-hidden border border-ink/5 relative shadow-2xl shadow-ink/5"
      style={{ cursor: 'pointer' }}
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
        className="absolute top-2 left-1 bg-ink text-white px-1 py-0.5 text-[6px] uppercase font-mono tracking-tighter z-20"
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

  const categoryInfo = CATEGORIES.find((c) => c.id === product.category);
  const CategoryIcon = categoryInfo?.icon || PakaianIcon;

  return (
    <motion.div
      ref={ref}
      variants={productCardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={index}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <PressButton href={`/shop/${product.slug}`} className="bg-white p-2 md:p-4 group relative overflow-hidden block border border-transparent hover:border-ink/5">
        <motion.div
          variants={cardImageVariants}
          className="aspect-[3/4] overflow-hidden mb-1 md:mb-3 relative bg-white border border-ink/5"
          animate={{ scale: isHovered ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain transition-all duration-700 grayscale group-hover:grayscale-0"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <CategoryIcon />
            </div>
          )}

          <motion.div
            className="absolute top-0 left-0 bg-ink text-white px-1.5 py-0.5 text-[6px] uppercase tracking-tighter z-10"
            animate={{ opacity: isHovered ? 0.5 : 1 }}
            transition={{ duration: DURATION.fast }}
          >
            NINOC {(index + 101).toString()}
          </motion.div>
        </motion.div>

        <motion.div variants={cardContentVariants} className="space-y-1 md:space-y-1.5">
          <motion.p
            className="text-[7px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 md:text-ink/30"
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            transition={{ duration: DURATION.fast }}
          >
            {categoryInfo?.label || 'Garment Origin'}
          </motion.p>

          <motion.h3
            className="text-[9px] md:text-base font-display font-medium italic uppercase tracking-tight line-clamp-1"
            animate={isHovered ? brandColor : darkColor}
            transition={{ duration: DURATION.fast }}
          >
            {product.name}
          </motion.h3>

          <motion.div
            className="flex flex-col justify-between pt-1.5 md:pt-3 border-t border-ink/5 mt-1.5 md:mt-3 gap-1 md:gap-3"
            animate={{ opacity: isHovered ? 1 : 0.8 }}
            transition={{ duration: DURATION.fast }}
          >
            <div className="space-y-0.5 md:space-y-1">
              <p className="text-[6px] md:text-[7px] uppercase tracking-widest text-ink/40 leading-none">Archival Issue</p>
              {product.price_tag && (
                <motion.p
                  className="text-[8px] font-medium uppercase tracking-[0.2em] text-rose leading-none"
                  animate={{ scale: isHovered ? 1.05 : 1 }}
                  transition={{ duration: DURATION.fast }}
                >
                  {product.price_tag}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <motion.p
                className="text-[9px] md:text-sm font-display font-medium italic text-ink"
                animate={{ scale: isHovered ? 1.02 : 1 }}
                transition={{ duration: DURATION.fast }}
              >
                IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </motion.p>

              <motion.div
                className="w-5 h-5 md:w-7 md:h-7 rounded-none bg-ink/5 flex items-center justify-center"
                animate={{ backgroundColor: isHovered ? brandColor.color : 'rgba(20,20,20,0.05)' }}
                transition={{ duration: DURATION.fast }}
              >
                <motion.div
                  animate={{ x: isHovered ? 4 : 0, color: isHovered ? '#ffffff' : '#141414' }}
                  transition={{ duration: DURATION.fast, ease: EASING.out }}
                >
                  <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </PressButton>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRUST ITEM
// ═══════════════════════════════════════════════════════════════

function TrustItem({ icon, title, desc, index }: { icon: React.ReactNode; title: string; desc: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center text-center space-y-2 md:space-y-6 cursor-default"
      variants={metadataVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={index}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="w-10 h-10 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose"
        variants={trustIconVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        custom={index}
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(232, 82, 122, 0.1)' }}
        transition={{ duration: DURATION.fast, ease: EASING.out }}
      >
        {icon}
      </motion.div>
      <div className="space-y-0 md:space-y-2">
        <motion.h3
          className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest leading-none"
          animate={isHovered ? brandColor : darkColor}
          transition={{ duration: DURATION.fast }}
        >
          {title}
        </motion.h3>
        <p className="text-[6px] md:text-[8px] font-medium uppercase tracking-tighter md:tracking-widest text-ink/60 md:text-ink/30 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY QUICK ACCESS — Mobile optimized size
// ═══════════════════════════════════════════════════════════════

function CategoryQuickAccess() {
  const brandColor = useBrandColor();

  return (
    <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2">
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
              className="flex items-center gap-2 md:gap-4 bg-white border border-ink/10 px-3 py-2.5 md:px-6 md:py-4 group whitespace-nowrap rounded-none"
              whileHover={{ borderColor: brandColor.color, backgroundColor: brandColor.color }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Icon container - bigger for mobile */}
              <motion.div
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-ink/5 rounded-none"
                animate={{ backgroundColor: brandColor.color }}
                transition={{ duration: DURATION.fast }}
              >
                <motion.div
                  animate={{ color: '#ffffff' }}
                  transition={{ duration: DURATION.fast }}
                  className="text-rose"
                >
                  <Icon />
                </motion.div>
              </motion.div>

              {/* Label */}
              <div className="flex flex-col leading-none gap-0.5">
                <motion.span
                  className="text-sm md:text-base font-display font-medium italic uppercase tracking-tight"
                  animate={{ color: '#141414' }}
                  transition={{ duration: DURATION.fast }}
                >
                  {cat.label}
                </motion.span>
                <motion.span
                  className="text-[8px] md:text-[9px] font-medium uppercase tracking-[0.15em] text-ink/50"
                  animate={{ color: 'rgba(20,20,20,0.5)' }}
                  transition={{ duration: DURATION.fast }}
                >
                  {cat.sublabel}
                </motion.span>
              </div>

              {/* Arrow */}
              <motion.div
                className="ml-2"
                animate={{ x: 0, opacity: 0.4 }}
                transition={{ duration: DURATION.fast }}
              >
                <ArrowRight size={14} />
              </motion.div>
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('*').limit(8);
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="mobile-momentum select-none">

      {/* HERO SECTION */}
      <section className="relative md:pt-24 pt-2 pb-0 px-4 md:px-12 max-w-[1800px] mx-auto border-b border-ink/5">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center lg:items-start">

          {/* Left: Branding */}
          <div className="lg:col-span-4 space-y-2.5 md:space-y-6 lg:pt-40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: DURATION.medium, ease: EASING.out }}
              className="flex items-center gap-2 text-rose"
            >
              <Paperclip className="w-3 h-3 md:w-[18px] md:h-[18px]" />
              <span className="text-[7px] md:text-[10px] font-medium uppercase tracking-[0.3em]">Origin Specification</span>
            </motion.div>

            <h1 className="text-3xl md:text-8xl font-display font-medium italic tracking-tighter text-ink leading-[0.75] uppercase">
              {["Archival", "Apparel"].map((word, wi) => (
                <span key={word} className="block overflow-hidden">
                  <motion.span variants={wordVariants} initial="hidden" animate="visible" custom={wi} className="block">{word}</motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: DURATION.medium, ease: EASING.out }}
              className="text-[8px] md:text-sm font-medium leading-tight md:leading-relaxed text-ink/80 md:text-ink/60 max-w-[120px] md:max-w-sm uppercase tracking-tight md:tracking-wider"
            >
              Established for the preservation of garment integrity. <span className="hidden md:inline">Our collection represents a curated selection of technical excellence and timeless design.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: DURATION.medium, ease: EASING.out }}
            >
              <PressButton href="/category" className="group inline-flex items-center gap-2 text-ink">
                {/* Mobile: Simple capsule with icon + text */}
                <span className="md:hidden inline-flex items-center gap-1.5 bg-ink/5 px-3 py-1.5 border border-ink/10">
                  <span className="text-[7px] font-medium uppercase tracking-[0.2em]">Catalog</span>
                  <ArrowRight size={10} className="text-rose group-hover:translate-x-0.5 transition-transform" />
                </span>
                {/* Desktop: Full line + text */}
                <span className="hidden md:inline text-[11px] font-medium uppercase tracking-[0.4em]">Browse Category</span>
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

            {/* Mobile Metadata - Left aligned, flush with Browse Category */}
            <div className="grid grid-cols-3 gap-0 mt-6 md:hidden">
              {[
                { label: 'YEAR', value: '2024' },
                { label: 'LOC', value: 'BDG, ID' },
                { label: 'PHIL', value: 'Simplicity' }
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex flex-col items-start text-left border-x border-ink/5 first:border-l-0 last:border-r-0"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1, duration: DURATION.medium, ease: EASING.out }}
                >
                  <p className="text-[5px] font-medium uppercase tracking-[0.3em] text-ink/25 leading-none mt-2 mb-0.5">{item.label}</p>
                  <p className="text-[7px] font-medium text-ink uppercase italic leading-none tracking-tight pb-2">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Middle: Portrait Carousel */}
          <div className="lg:col-span-4 relative mt-4 lg:mt-0">
            <PortraitImageCarousel />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: DURATION.medium, ease: EASING.out }}
              className="absolute -bottom-8 -right-8 bg-white p-6 rounded-none border border-ink/5 shadow-xl hidden md:block z-30"
            >
              <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30 mb-2">Technical Detail</p>
              <p className="text-[10px] font-medium text-ink uppercase">Hand-stitched precision<br />Industrial Grade Fabrics</p>
            </motion.div>
          </div>

          {/* Right: Metadata Sidebar */}
          <div className="col-span-2 lg:col-span-4 lg:pt-20 -mt-10 md:mt-0 lg:mt-0">
            <div className="hidden md:flex flex-col space-y-3 border-l border-ink/5 pl-8">
              {[{ label: 'Year', value: 'Est. 2024' }, { label: 'Location', value: 'Bandung, Indonesia' }, { label: 'Philosophy', value: '"Functionality through absolute simplicity."' }].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="space-y-0"
                  variants={metadataVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  custom={i}
                >
                  <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20">{item.label}</p>
                  <p className={`text-[10px] font-medium text-ink ${i === 2 ? 'italic leading-tight' : ''}`}>{item.value}</p>
                </motion.div>
              ))}

              <motion.div
                className="bg-ink text-white p-8 rounded-none space-y-6 hidden lg:block mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: 0.5, duration: DURATION.medium, ease: EASING.out }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-rose">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-widest">Origin Verified</span>
                </div>
                <div className="text-[11px] font-medium uppercase leading-loose tracking-widest !text-white !opacity-100">Not just clothing. These are artifacts born from the streets, the stage, and the culture that shaped who we are.</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY INDEX — QUICK ACCESS - Mobile optimized */}
      <section className="px-4 md:px-12 max-w-[1800px] mx-auto mt-4 md:mt-16 mb-0 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: DURATION.medium, ease: EASING.out }}
          className="flex items-end justify-between mb-4 md:mb-6"
        >
          <div className="flex items-center gap-2">
            <div className="text-rose">
              <Grid3X3 size={12} />
            </div>
            <span className="text-[8px] md:text-[9px] font-medium uppercase tracking-[0.4em] text-ink/40">Category Index</span>
          </div>
          <PressButton href="/category" className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose leading-none">
            View All
          </PressButton>
        </motion.div>
        <CategoryQuickAccess />
      </section>

      {/* CATALOG */}
      <section id="archive-catalog" className="mt-0 md:mt-2 px-4 md:px-12 max-w-[1800px] mx-auto">
        <motion.div
          className="flex items-end justify-between border-b border-ink/5 pb-1 md:pb-4 mb-0.5 md:mb-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: DURATION.medium, ease: EASING.out }}
        >
          <h2 className="text-xs md:text-lg font-display font-medium italic tracking-tighter uppercase text-ink leading-none translate-y-[1.5px] md:translate-y-0">New Releases</h2>
          <PressButton href="/shop" className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest text-ink hover:text-rose leading-none">
            View All
          </PressButton>
        </motion.div>

        <div className="relative -mx-4 md:mx-0">
          <DragSlider className="flex gap-px w-full">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-[48vw] md:w-[300px] aspect-[3/4] bg-white animate-pulse flex-shrink-0"
                />
              ))
            ) : (
              products.map((product, i) => (
                <div key={product.id} className="w-[48vw] md:w-[300px] flex-shrink-0">
                  <ProductCard product={product} index={i} />
                </div>
              ))
            )}
          </DragSlider>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block" />
        </div>
      </section>

      {/* TRUST SYMBOLS */}
      <FadeUpSection delay={0.2}>
        <section className="md:mt-40 mt-6 md:mb-40 mb-6 border-y border-ink/5 py-4 md:py-24 bg-white/30 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-20">
            <TrustItem icon={<ShieldCheck className="w-5 h-5 md:w-7 md:h-7" />} title="Quality Assured" desc="Rigorous inspection." index={0} />
            <TrustItem icon={<Zap className="w-5 h-5 md:w-7 md:h-7" />} title="Instant Logistics" desc="Rapid fulfillment." index={1} />
            <TrustItem icon={<Package className="w-5 h-5 md:w-7 md:h-7" />} title="Secure Storage" desc="Protected storage." index={2} />
          </div>
        </section>
      </FadeUpSection>

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
                <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-widest text-ink/40 mb-1">Follow Us</p>
                <p className="text-[11px] md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">@ninoc.co</p>
                <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1">Instagram</p>
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
                <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-widest text-ink/40 mb-1">Email Us</p>
                <p className="text-[11px] md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">beatstoria.ai@gmail.com</p>
                <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1">Direct Message</p>
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
                <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-widest text-ink/40 mb-1">WhatsApp</p>
                <p className="text-[11px] md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">+62 8211983774</p>
                <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1">Chat Now</p>
              </a>

            </div>

            {/* Bottom CTA */}
            <div className="mt-8 pt-6 border-t border-ink/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-[7px] font-medium uppercase tracking-[0.4em] text-rose">NINOC ENTERPRISE</p>
                <p className="text-[10px] md:text-xs font-display font-medium italic text-ink mt-0.5">Wear the art, own the day.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/about" className="px-5 py-2.5 bg-rose text-white text-[9px] font-semibold uppercase tracking-widest hover:bg-rose/90 transition-colors">
                  About NINOC
                </Link>
                <Link href="/shop" className="px-5 py-2.5 border border-ink/10 text-ink/50 text-[9px] font-semibold uppercase tracking-widest hover:border-ink/20 hover:text-ink transition-colors">
                  Browse Catalog
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeUpSection>
    </div>
  );
}