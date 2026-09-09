"use client";

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { productCardVariants, cardImageVariants, cardContentVariants, DURATION, EASING } from '@/lib/animations';
import DragSlider from '@/components/DragSlider';
import { useCart } from '@/store/useCart';
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

function getCategoryInfo(categoryStr?: string) {
  if (!categoryStr) return CATEGORIES[0];
  const pillar = classifyDepartment(categoryStr);
  if (pillar === 'PANTRY') return CATEGORIES[2];
  if (pillar === 'OBJECTS') return CATEGORIES[1];
  return CATEGORIES[0];
}

function PressButton({ children, className = '', onClick, href, whileHover, whileTap }: any) {
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
    <button onClick={onClick} type="button" className="w-auto bg-transparent border-none p-0 m-0">
      {inner}
    </button>
  );
}

interface Product {
  id: string; name: string; price: number; original_price?: number | null; image_url?: string; slug: string; category?: CategoryType; price_tag?: string | null;
}

function ProductCard({ product, index }: { product: Product, index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };

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
              unoptimized
              className="object-cover object-top transition-all duration-700 select-none pointer-events-none"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <CategoryIcon />
            </div>
          )}

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

          {/* Program & Promo Badge — Top Right (Orange & White) */}
          {isDiscountActive(product) && product.original_price ? (
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
              <div className="flex flex-col">
                {product.original_price && product.original_price > product.price && !product.price_tag?.includes('REDEEM') && (
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

export default function HomeProductSlider({ products, isLoading }: { products: Product[], isLoading: boolean }) {
  // Removed min-h-screen bug here!
  return (
    <section id="archive-catalog" className="mt-0 px-4 md:px-12 max-w-[1800px] mx-auto pt-1 md:pt-2 pb-8 md:pb-12">
      <div className="flex items-center justify-between mb-2 md:mb-2 border-b border-ink/5 pb-1">
        <h2 className="text-base md:text-lg font-display font-medium italic uppercase tracking-tighter text-ink leading-none">
          New Arrivals
        </h2>
        <Link href="/shop" className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/50 hover:text-rose transition-colors">
          View All
        </Link>
      </div>
      <div className="relative -mx-4 md:mx-0">
        <DragSlider className="flex gap-px w-full">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="w-[45vw] md:w-[160px] aspect-[4/5] bg-ink/5 animate-pulse flex-shrink-0"
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
  );
}
