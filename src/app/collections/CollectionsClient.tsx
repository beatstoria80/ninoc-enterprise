"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Layers, ChevronRight, ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useBrandColor } from '@/components/BrandProvider';
import { Collection, Product, CollectionProduct } from '@/components/admin/types';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';

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
  micro: 0.1,
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
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

  if (href) return <Link prefetch={false} href={href}>{inner}</Link>;
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
                <video src={col.banner_url!} className="w-full h-full object-cover transition-transform duration-700" style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }} autoPlay muted loop playsInline />
              ) : (
                <Image src={col.banner_url!} alt={col.name} fill className="object-cover transition-transform duration-700" style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }} />
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
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };
  const { addItem } = useCart();
  const router = useRouter();

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url || null, slug: product.slug });
    router.push('/checkout');
  };

  return (
    <motion.div
      variants={productCardVariants}
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="block bg-white p-2 md:p-3 group relative overflow-hidden border border-transparent hover:border-ink/5"
      >
        <div className="relative mb-2 md:mb-3 overflow-hidden aspect-[4/5] bg-white flex items-center justify-center border border-ink/5">
          {product.image_url ? (
            <div className="absolute inset-3 z-10 mix-blend-multiply">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain transition-transform duration-700"
                sizes="(max-width: 768px) 30vw, 15vw"
                style={{
                  filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                }}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <Package size={24} />
            </div>
          )}

          {product.is_featured && (
            <motion.div
              className="absolute top-1 left-1 md:top-2 md:left-2 text-[5px] md:text-[6px] font-medium uppercase tracking-[0.2em] bg-ink text-white px-1 py-0.5"
              animate={{ backgroundColor: isHovered ? brandColor.color : '#141414' }}
              transition={{ duration: DURATION.fast }}
            >
              New
            </motion.div>
          )}
        </div>

        <div className="space-y-0.5">
          <motion.span
            className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/25 block"
            animate={{ color: isHovered ? brandColor.color : 'rgba(20,20,20,0.25)' }}
            transition={{ duration: DURATION.fast }}
          >
            {product.category}
          </motion.span>
          <motion.h3
            className="text-xs md:text-[9px] md:text-[10px] font-display font-medium italic uppercase tracking-tight"
            animate={isHovered ? brandColor : darkColor}
            transition={{ duration: DURATION.fast }}
          >
            {product.name}
          </motion.h3>

          <motion.div
            className="flex items-center justify-between"
            animate={{ opacity: isHovered ? 1 : 0.6 }}
            transition={{ duration: DURATION.fast }}
          >
            <span className="text-[11px] md:text-[8px] md:text-[9px] font-medium text-ink/50 block">
              IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <motion.button
              onClick={handleQuickBuy}
              className="w-5 h-5 md:w-6 md:h-6 rounded-none bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-colors"
              animate={{ backgroundColor: isHovered ? 'rgba(20,20,20,0.1)' : 'rgba(20,20,20,0.05)' }}
            >
              <ShoppingCart className="w-3 h-3" />
            </motion.button>
          </motion.div>
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
    <main className="min-h-screen bg-cr noise pt-4 md:pt-20 px-4 md:px-12 pb-[120px]">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.normal, ease: EASING.out }}
            className="text-xs md:text-[9px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40 flex items-center gap-2"
          >
            <Layers size={10} className="text-rose" />
            Curated Campaigns
          </motion.h1>

          <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose">
            <ArrowLeft size={10} className="rotate-180" />
            <span className="text-[10px] md:text-[7px] md:text-[8px] font-medium uppercase tracking-[0.3em]">Exit</span>
          </PressButton>
        </div>

        {/* COLLECTION INDEX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          {collections.map((col, index) => (
            <CollectionCard
              key={col.id}
              col={col}
              index={index}
            />
          ))}
          {collections.length === 0 && !isLoading && (
            <div className="col-span-full py-24 text-center border border-dashed border-ink/10 rounded-xl">
              <p className="text-xs md:text-[10px] text-ink/40 uppercase tracking-widest">No active campaigns</p>
            </div>
          )}
        </div>

        {/* ALL PRODUCTS GRID */}
        <div className="pt-2 md:pt-4">
          <h2 className="text-xs md:text-[9px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40 mb-4">All Products Archive</h2>
          <AnimatePresence mode="wait">
            <motion.div
              variants={productGridVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.normal }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-ink/5 border border-ink/5"
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
          className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-[40] bg-cr/95 backdrop-blur-md border-t border-ink/5"
        >
          <div className="max-w-[1800px] mx-auto px-4 md:px-12 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <motion.div
                className="space-y-0.5"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <p className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Total Items</p>
                <p className="text-lg font-display font-medium italic text-ink">{products.length}</p>
              </motion.div>
              <div className="h-8 w-[1px] bg-ink/10 hidden md:block" />
              <motion.div
                className="space-y-0.5"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <p className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Collections</p>
                <p className="text-lg font-display font-medium italic text-ink">{collections.length}</p>
              </motion.div>
            </div>
            <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose">
              <span className="text-xs md:text-[9px] font-medium uppercase tracking-[0.3em]">Full Catalog</span>
              <ChevronRight size={14} />
            </PressButton>
          </div>
        </motion.div>

      </div>
    </main>
  );
}