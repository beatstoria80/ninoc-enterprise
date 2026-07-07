"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Layers, ChevronRight, ArrowLeft, Package, ShoppingCart, Eye } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getProductStock, getProductViews } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useBrandColor } from '@/components/BrandProvider';
import { Collection, Product, CollectionProduct } from '@/components/admin/types';
import { useRouter } from 'next/navigation';
import { formatCategoryLabel } from '@/lib/departmentDomain';
import { useCatalogViews } from '@/hooks/shop/useCatalogViews';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM ICONS — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

const HangerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3C12 3 12 5 12 6M12 6L4 10M12 6L20 10" />
    <path d="M4 10L4 18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V10" />
    <path d="M4 10H20" />
  </svg>
);

const FlameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C12 2 8 7 8 11C8 13.76 9.68 16 12 16C14.32 16 16 13.76 16 11C16 11 16 8 12 2Z" />
    <path d="M12 16C12 16 10 18.5 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.5 12 16 12 16Z" />
  </svg>
);

const ClockRewindIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7V12L9 14" />
  </svg>
);

const DefaultIcon = () => <Layers size={16} strokeWidth={1.5} />;

// ═══════════════════════════════════════════════════════════════
// ANIMATION ENGINE
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
};

const DURATION = {
  micro: 0.05,
  fast: 0.08,
  normal: 0.12,
  medium: 0.18,
  slow: 0.3,
};

const collectionIndexVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.fast, ease: EASING.out } },
};

const productCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
  hover: { y: -2, transition: { duration: DURATION.fast, ease: EASING.out } },
};

const productGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

// ═══════════════════════════════════════════════════════════════
// PRESS BUTTON
// ═══════════════════════════════════════════════════════════════

function PressButton({ children, className = '', onClick, href }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
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
// COLLECTION CARD
// ═══════════════════════════════════════════════════════════════

function CollectionCard({ col, index }: {
  col: Collection;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const white = '#ffffff';
  
  // Cycle icons based on index
  const icons = [HangerIcon, FlameIcon, ClockRewindIcon];
  const Icon = icons[index % icons.length] || DefaultIcon;

  const isVideoUrl = (url: string | null | undefined) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  const hasBanner = !!col.banner_url;

  return (
    <Link href={`/collections/${col.slug}`} className="block h-full">
      <motion.div
        variants={collectionIndexVariants}
        initial="hidden"
        animate="visible"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative bg-white py-8 px-4 md:py-10 md:px-6 text-left group overflow-hidden flex flex-col items-center justify-center gap-3 border border-transparent hover:border-ink/10 cursor-pointer h-full min-h-[180px]"
      >
        {/* Banner Media Background */}
        {hasBanner ? (
          <>
            <div className="absolute inset-0 z-0">
              {isVideoUrl(col.banner_url) ? (
                <video src={col.banner_url!} poster="/og-image.png" className="w-full h-full object-cover transition-transform duration-700 scale-[1.15] md:scale-100 group-hover:scale-[1.2] md:group-hover:scale-105" autoPlay muted loop playsInline />
              ) : (
                <Image src={col.banner_url!} alt={col.name} fill className="object-cover transition-transform duration-700 scale-100 group-hover:scale-105" />
              )}
            </div>
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/40 z-0"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: isHovered ? 0.6 : 0.4 }}
              transition={{ duration: DURATION.medium }}
            />
          </>
        ) : (
          <motion.div
            className="absolute inset-0 bg-rose origin-bottom z-0"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: isHovered ? 1 : 0 }}
            transition={{ duration: DURATION.medium, ease: EASING.out }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center gap-3 w-full text-center">
          <motion.div
            className="flex-shrink-0"
            animate={{ color: hasBanner ? white : (isHovered ? white : brandColor.color) }}
            transition={{ duration: DURATION.fast }}
          >
            <Icon />
          </motion.div>

          <div className="flex flex-col items-center gap-1.5 min-w-0">
            <motion.h3
              className="text-xs md:text-sm font-display font-medium italic uppercase tracking-tight drop-shadow-sm"
              animate={{ color: hasBanner ? white : (isHovered ? white : '#141414') }}
              transition={{ duration: DURATION.fast }}
            >
              {col.name}
            </motion.h3>
            <motion.span
              className="text-[11px] md:text-[8px] md:text-[9px] font-medium uppercase tracking-widest drop-shadow-sm"
              animate={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : (isHovered ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,20,0.4)') }}
              transition={{ duration: DURATION.fast }}
            >
              {col.status === 'active' ? 'Live Now' : 'Coming Soon'}
            </motion.span>
          </div>

          <motion.div
            className="mt-2 drop-shadow-sm"
            animate={{ 
              x: isHovered ? 4 : 0, 
              color: hasBanner ? white : (isHovered ? white : 'rgba(20,20,20,0.2)') 
            }}
            transition={{ duration: DURATION.fast }}
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════════

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { allViews } = useCatalogViews();

  const getDisplayViews = (prod: Product) => {
    if (allViews) {
      const realViews = Object.entries(allViews).find(([key]) => key.includes(prod.slug))?.[1];
      if (realViews && realViews > 0) return realViews;
    }
    return getProductViews(prod);
  };

  return (
    <motion.div
      variants={productCardVariants}
      whileHover="hover"
      className="h-full"
    >
      <Link href={`/shop/${product.slug}`} className="block h-full border border-ink/5 bg-white shadow-sm flex flex-col">
        <div className="aspect-[4/5] bg-ink/[0.02] rounded-none overflow-hidden border-b border-ink/5 relative">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              draggable={false}
              className="select-none pointer-events-none object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <Package size={24} />
            </div>
          )}
          {product.price_tag && (
            <div className="absolute top-1 right-1 bg-white/95 backdrop-blur-sm text-rose border border-rose/10 px-1 py-0.5 text-[6px] md:text-[5px] font-medium uppercase tracking-[0.2em] shadow-sm z-10 pointer-events-none">
              {product.price_tag}
            </div>
          )}
        </div>
        <div className="p-1.5 md:p-2 space-y-1.5 md:space-y-1.5 flex flex-col justify-between flex-grow">
          <div>
            <h3 className="text-xs md:text-[8px] lg:text-[9px] font-semibold uppercase tracking-tight text-ink line-clamp-2 leading-snug">
              {product.name}
            </h3>
            <p className="text-[9px] md:text-[6px] lg:text-[6.5px] font-semibold text-ink/60 uppercase tracking-[0.2em] mt-0.5">
              {formatCategoryLabel(product.category)}
            </p>
          </div>

          <div className="space-y-1 md:space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-[9px] lg:text-[10px] font-display font-semibold italic text-rose">
                {product.price_tag === 'REDEEM'
                  ? `${(product.price ?? 0).toLocaleString('id-ID')} PTS`
                  : `IDR ${(product.price ?? 0).toLocaleString('id-ID')}`}
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
                }}
                className="w-8 h-8 md:w-6 md:h-6 bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-colors cursor-pointer relative z-20"
              >
                <ShoppingCart className="w-4 h-4 md:w-3.5 md:h-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-ink/5">
              <div className="flex items-center gap-1 text-ink/70" title="Google Analytics Realtime SKU Viewers">
                <Eye className="w-2.5 h-2.5 text-rose animate-pulse shrink-0" />
                <span className="text-[7px] md:text-[6px] font-mono font-semibold uppercase tracking-wider">
                  {getDisplayViews(product)} DILIHAT
                </span>
              </div>
              <span className="text-[7px] md:text-[6px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                {getProductStock(product)} STOK
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COLLECTIONS PAGE
// ═══════════════════════════════════════════════════════════════

export default function CollectionsClient({ initialProducts = [], initialCollections = [] }: { initialProducts?: Product[], initialCollections?: Collection[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect fetch removed since we use server-side initial data

  return (
    <main className="min-h-screen bg-cr noise pt-4 md:pt-20 px-2 md:px-4 pb-[80px]">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.normal, ease: EASING.out }}
            className="text-xs md:text-[9px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/60 flex items-center gap-2"
          >
            <Layers size={10} className="text-rose" />
            Curated Campaigns
          </motion.h1>

          <PressButton href="/shop" className="flex items-center gap-2 text-ink/60 hover:text-rose">
            <ArrowLeft size={10} className="rotate-180" />
            <span className="text-[10px] md:text-[7px] md:text-[8px] font-medium uppercase tracking-[0.3em]">Exit</span>
          </PressButton>
        </div>

        {/* COLLECTION INDEX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 md:mb-6">
          {collections.map((col, index) => (
            <CollectionCard
              key={col.id}
              col={col}
              index={index}
            />
          ))}
          {collections.length === 0 && !isLoading && (
            <div className="col-span-full py-24 text-center border border-dashed border-ink/10 rounded-xl">
              <p className="text-xs md:text-[10px] text-ink/60 uppercase tracking-widest">No active campaigns</p>
            </div>
          )}
        </div>

        {/* ALL PRODUCTS GRID */}
        <div className="pt-2 md:pt-4">
          <h2 className="text-xs md:text-[9px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/60 mb-4">All Products Archive</h2>
          <AnimatePresence mode="wait">
            <motion.div
              variants={productGridVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.normal }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-1.5 bg-transparent"
            >
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white aspect-[3/4] animate-pulse"
                  />
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-16 text-center bg-white"
                >
                  <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/20">
                    No products found
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FIXED STATS FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: DURATION.medium }}
          className="fixed bottom-[calc(70px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-[40] bg-cr/95 backdrop-blur-md border-t border-ink/5"
        >
          <div className="max-w-[1800px] mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-6 md:gap-8">
              <motion.div
                className="flex flex-col items-start"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <p className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/50 mb-0.5">Total Items</p>
                <p className="text-sm md:text-base font-display font-medium italic text-ink leading-none">{products.length}</p>
              </motion.div>
              <div className="h-6 w-[1px] bg-ink/10" />
              <motion.div
                className="flex flex-col items-start"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <p className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/50 mb-0.5">Collections</p>
                <p className="text-sm md:text-base font-display font-medium italic text-ink leading-none">{collections.length}</p>
              </motion.div>
            </div>
            <PressButton href="/shop" className="group flex items-center gap-1.5 text-ink/60 hover:text-rose transition-colors">
              <span className="text-[8px] font-medium uppercase tracking-[0.3em]">Full Catalog</span>
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </PressButton>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
