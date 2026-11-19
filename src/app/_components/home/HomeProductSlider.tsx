"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { productCardVariants, cardImageVariants, cardContentVariants, DURATION, EASING } from '@/lib/animations';
import DragSlider from '@/components/DragSlider';
import { useBrandColor } from '@/components/BrandProvider';
import { CategoryType } from '@/types';
import { classifyDepartment } from '@/lib/departmentDomain';
import { isDiscountActive } from '@/lib/domain/product';
import Link from '@/components/LocalizedLink';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Icons
const ApparelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
);

const ObjectsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const PantryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 110 8h-1" />
    <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

const CATEGORIES = [
  { id: 'pakaian' as CategoryType, label: 'Apparel', sublabel: 'Fashion', icon: ApparelIcon, href: '/shop?filter=Apparel', spec: 'APR-001' },
  { id: 'utilities' as CategoryType, label: 'Home & Living', sublabel: 'Homeware', icon: ObjectsIcon, href: '/shop?filter=Objects', spec: 'OBJ-002' },
  { id: 'coffee' as CategoryType, label: 'Pantry & Café', sublabel: 'F&B', icon: PantryIcon, href: '/shop?filter=Pantry', spec: 'PTR-003' },
];

function getCategoryInfo(categoryStr?: string | null) {
  if (!categoryStr) return CATEGORIES[0];
  const pillar = classifyDepartment(categoryStr);
  if (pillar === 'PANTRY') return CATEGORIES[2];
  if (pillar === 'OBJECTS') return CATEGORIES[1];
  return CATEGORIES[0];
}

// REFACTOR: Replaced 'any' with strictly typed interface for PressButton
interface PressButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  whileHover?: Parameters<typeof motion.div>[0]['whileHover'];
  whileTap?: Parameters<typeof motion.div>[0]['whileTap'];
}

function PressButton({ children, className = '', onClick, href, whileHover, whileTap }: PressButtonProps) {
  const inner = (
    <motion.div
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      className={cn(className, "cursor-pointer")}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return (
    <button onClick={onClick} type="button" className="w-auto bg-transparent border-none p-0 m-0 text-left">
      {inner}
    </button>
  );
}

// REFACTOR: Strictly typed Product interface incorporating display_order, badge_text, and variants without 'any'
export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  slug: string;
  category?: CategoryType | string | null;
  sub_category?: string | null;
  price_tag?: string | null;
  badge_text?: string | null;
  display_order?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  created_at?: string;
  variants?: Array<{
    id: string;
    sku?: string | null;
    size?: string | null;
    color?: string | null;
    stock_quantity?: number | null;
  }>;
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [isHovered, setIsHovered] = useState(false);
  // REFACTOR: Use useSyncExternalStore for hydration-safe client mounting without cascading setState in useEffect
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };

  const hasActiveDiscount = isMounted && isDiscountActive(product);

  const categoryInfo = getCategoryInfo(product.category);
  const CategoryIcon = categoryInfo?.icon || ApparelIcon;

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
      <PressButton href={`/shop/${product.slug}`} className="bg-white p-2.5 md:p-3 group relative overflow-hidden flex flex-col h-full border border-transparent hover:border-ink/10 transition-colors">
        <motion.div
          variants={cardImageVariants}
          className="aspect-[4/5] overflow-hidden mb-3 md:mb-3.5 relative bg-ink/5 border border-ink/5"
          animate={{ scale: isHovered ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              draggable={false}
              unoptimized
              className="object-cover object-top transition-all duration-700 select-none pointer-events-none"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <CategoryIcon />
            </div>
          )}

          {/* Badge Top Left: Standard NEW badge for first items without discount/price_tag */}
          {(!hasActiveDiscount && !product.price_tag && index < 3) && (
            <motion.div
              className="absolute top-0 left-0 text-white px-2 py-1 text-[9px] uppercase tracking-widest z-10 font-bold bg-ink shadow-sm"
              animate={{ opacity: isHovered ? 0.9 : 1 }}
              transition={{ duration: DURATION.fast }}
            >
              NEW
            </motion.div>
          )}

          {/* Program & Promo Badge — Top Right */}
          {hasActiveDiscount && product.original_price ? (
            <div className="absolute top-0 right-0 z-10 bg-[#FF6B00] text-white px-2 py-1 shadow-md pointer-events-none flex items-center gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                -{Math.round(((product.original_price - (product.price || 0)) / product.original_price) * 100)}%
              </span>
            </div>
          ) : product.price_tag ? (
            <div className="absolute top-0 right-0 z-10 bg-[#FF6B00] text-white px-2 py-1 shadow-md pointer-events-none">
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] leading-none">
                {product.price_tag}
              </span>
            </div>
          ) : product.badge_text ? (
            <div className="absolute top-0 right-0 z-10 bg-ink text-white px-2 py-1 shadow-md pointer-events-none">
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] leading-none">
                {product.badge_text}
              </span>
            </div>
          ) : null}
        </motion.div>

        <motion.div variants={cardContentVariants} className="flex flex-col flex-grow">
          <div className="space-y-0.5">
            <motion.p
              className="text-[9px] md:text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/50 leading-none"
              animate={{ opacity: isHovered ? 1 : 0.7 }}
              transition={{ duration: DURATION.fast }}
            >
              {categoryInfo?.label || 'NINOC'}
            </motion.p>
            <motion.h3
              className="text-[11px] md:text-xs font-display font-medium italic uppercase tracking-tighter line-clamp-2 leading-snug"
              animate={isHovered ? brandColor : darkColor}
              transition={{ duration: DURATION.fast }}
            >
              {product.name}
            </motion.h3>
          </div>
          <div className="mt-auto pt-1.5 border-t border-ink/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                {hasActiveDiscount && product.original_price && !product.price_tag?.includes('REDEEM') && (
                  <span className="line-through text-ink/40 text-[9px] md:text-[10px] font-medium not-italic leading-none mb-0.5">
                    IDR {product.original_price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
                <motion.p
                  className={cn("text-xs md:text-[12px] font-display font-medium italic whitespace-nowrap leading-none", product.price_tag && !product.price_tag.includes('REDEEM') ? 'text-rose' : 'text-ink')}
                  animate={{ scale: isHovered ? 1.02 : 1 }}
                  transition={{ duration: DURATION.fast }}
                >
                  IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </motion.p>
              </div>

              <div className="flex gap-1.5 relative z-10">
                <motion.div
                  role="button"
                  tabIndex={0}
                  onClick={handleQuickBuy}
                  className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: DURATION.fast, ease: EASING.out }}
                  aria-label="Quick Buy"
                >
                  <ShoppingBag className="w-4 h-4" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </PressButton>
    </motion.div>
  );
}

export default function HomeProductSlider({ products, isLoading }: { products: Product[]; isLoading: boolean }) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // REFACTOR: Enforce client-side sorting parity with /shop catalogue (display_order ASC then created_at DESC)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [products]);

  // REFACTOR: Check scroll boundaries to conditionally highlight/disable navigation buttons
  const updateScrollBounds = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateScrollBounds();
    el.addEventListener('scroll', updateScrollBounds, { passive: true });
    window.addEventListener('resize', updateScrollBounds);
    return () => {
      el.removeEventListener('scroll', updateScrollBounds);
      window.removeEventListener('resize', updateScrollBounds);
    };
  }, [updateScrollBounds, sortedProducts]);

  // REFACTOR: Programmatic scroll controls for laptop & wide screen desktop viewports
  const handleScroll = (dir: 'left' | 'right') => {
    const el = sliderRef.current;
    if (!el) return;
    const distance = dir === 'left' ? -Math.max(el.clientWidth * 0.7, 300) : Math.max(el.clientWidth * 0.7, 300);
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section id="archive-catalog" className="mt-0 px-4 md:px-12 max-w-[1800px] mx-auto pt-1 md:pt-2 pb-8 md:pb-12">
      {/* Header bar with title, counter, desktop controls, and View All link */}
      <div className="flex items-center justify-between mb-2 md:mb-3 border-b border-ink/5 pb-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base md:text-lg font-display font-medium italic uppercase tracking-tighter text-ink leading-none">
            New Arrivals
          </h2>
          {sortedProducts.length > 0 && (
            <span className="hidden sm:inline-block text-[10px] tracking-widest text-ink/40 font-mono">
              [{sortedProducts.length}]
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* REFACTOR: Desktop/Laptop navigation controls */}
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className="w-7 h-7 rounded-none border border-ink/10 flex items-center justify-center text-ink/70 hover:text-ink hover:border-ink/40 disabled:opacity-20 disabled:pointer-events-none transition-all duration-200"
              aria-label="Previous Products"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className="w-7 h-7 rounded-none border border-ink/10 flex items-center justify-center text-ink/70 hover:text-ink hover:border-ink/40 disabled:opacity-20 disabled:pointer-events-none transition-all duration-200"
              aria-label="Next Products"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link href="/shop" className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 hover:text-rose transition-colors">
            View All
          </Link>
        </div>
      </div>

      {/* REFACTOR: Responsive slider track across mobile, laptop, and wide screen viewports */}
      <div className="relative -mx-4 md:mx-0">
        <DragSlider ref={sliderRef} className="flex gap-px w-full px-4 md:px-0">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="w-[44vw] sm:w-[200px] md:w-[170px] lg:w-[185px] xl:w-[205px] 2xl:w-[220px] aspect-[4/5] bg-ink/5 animate-pulse flex-shrink-0"
              />
            ))
          ) : (
            sortedProducts.map((product, i) => (
              <div
                key={product.id}
                className="w-[44vw] sm:w-[200px] md:w-[170px] lg:w-[185px] xl:w-[205px] 2xl:w-[220px] flex-shrink-0"
              >
                <ProductCard product={product} index={i} />
              </div>
            ))
          )}
        </DragSlider>

        {/* REFACTOR: Sleek editorial fades on left and right for desktop/laptop */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none hidden md:block z-10 transition-opacity duration-300" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block z-10 transition-opacity duration-300" />
        )}
      </div>
    </section>
  );
}
