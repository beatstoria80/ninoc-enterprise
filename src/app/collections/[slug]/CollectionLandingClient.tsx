"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft, Package, Calendar, ShoppingCart } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useBrandColor } from '@/components/BrandProvider';
import { Collection, Product, CollectionProduct } from '@/components/admin/types';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════
// ANIMATION ENGINE
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,       /* Strong ease-out */
  inOut: [0.77, 0, 0.175, 1] as const,    /* Smooth morphing */
};

const DURATION = {
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
};

const productCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.normal, ease: EASING.out } },
  hover: { y: -2, transition: { duration: DURATION.fast, ease: EASING.out } },
  tap: { scale: 0.97, transition: { duration: 0.1, ease: EASING.out } }
};

const productGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

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
    window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
  };

  return (
    <motion.div
      variants={productCardVariants}
      whileHover="hover"
      whileTap="tap"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full flex flex-col w-[140px] md:w-[180px] flex-shrink-0"
    >
      <Link
        href={`/shop/${product.slug}`}
        className="block group relative h-full flex flex-col"
      >
        <div className="relative w-full aspect-[4/5] bg-ink/5 mb-2 md:mb-3 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 140px, 180px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <Package size={24} />
            </div>
          )}

          {product.is_featured && (
            <motion.div
              className="absolute top-0 left-0 text-[5px] md:text-[6px] font-medium uppercase tracking-[0.2em] bg-ink text-white px-1 py-0.5 z-10"
              animate={{ backgroundColor: isHovered ? brandColor.color : '#141414' }}
              transition={{ duration: DURATION.fast }}
            >
              New
            </motion.div>
          )}
        </div>

        <div className="space-y-0.5">
          <motion.span
            className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/30 block"
            animate={{ color: isHovered ? brandColor.color : 'rgba(20,20,20,0.3)' }}
            transition={{ duration: DURATION.fast }}
          >
            {product.category}
          </motion.span>
          <motion.h3
            className="text-xs md:text-[9px] md:text-[10px] font-display font-medium italic uppercase tracking-tight line-clamp-2"
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
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] md:text-[8px] md:text-[9px] font-medium text-ink/50">
                IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <div className="flex items-center gap-1 border border-rose/20 px-1 py-0.5 bg-rose/[0.02]">
                <span className="text-[6px] md:text-[6px] font-medium text-rose uppercase tracking-widest flex items-center gap-0.5">
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  PROMO
                </span>
              </div>
            </div>
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
// COLLECTION LANDING CLIENT
// ═══════════════════════════════════════════════════════════════

export default function CollectionLandingClient({ slug, initialCollection, initialProducts }: { slug: string; initialCollection?: Collection | null; initialProducts?: Product[] }) {
  const [collection] = useState<Collection | null>(initialCollection || null);
  const [products] = useState<Product[]>(initialProducts || []);
  const isNotFound = !initialCollection;

  if (isNotFound || !collection) {
    return (
      <main className="min-h-screen bg-cr noise pt-32 px-4 flex flex-col items-center">
        <h1 className="text-2xl font-display uppercase italic tracking-tight text-ink mb-4">Collection Not Found</h1>
        <Link href="/collections" className="text-xs uppercase tracking-widest text-ink/50 hover:text-rose transition-colors">
          Return to Collections Index
        </Link>
      </main>
    );
  }

  const isOngoing = !collection.end_date || new Date(collection.end_date) > new Date();

  const isVideoUrl = (url: string | null | undefined) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  return (
    <main className="h-[100dvh] w-full bg-cr noise flex flex-col overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full flex-1 min-h-0 bg-ink">
        {collection.banner_url ? (
          isVideoUrl(collection.banner_url) ? (
            <video 
              src={collection.banner_url} 
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              autoPlay 
              muted 
              loop 
              playsInline 
            />
          ) : (
            <Image 
              src={collection.banner_url} 
              alt={collection.name} 
              fill 
              className="object-cover opacity-70"
              priority
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="font-display italic text-6xl md:text-9xl tracking-tighter text-white">NINOC</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
        
        {/* Top Nav inside Hero */}
        <div className="absolute top-16 md:top-24 left-0 right-0 p-4 md:p-8 flex justify-between items-center z-10">
          <Link href="/collections" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform ease-[cubic-bezier(0.23,1,0.32,1)] duration-200" />
            <span className="text-xs md:text-[10px] uppercase tracking-[0.2em]">All Collections</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10">
          <div className="max-w-[1200px] mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: DURATION.slow, ease: EASING.out }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-[11px] md:text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-medium bg-white text-ink">
                  {collection.collection_type === 'smart' ? 'Smart Collection' : 'Curated Drop'}
                </span>
                {isOngoing && collection.status === 'active' ? (
                  <span className="flex items-center gap-1 text-xs md:text-[9px] text-emerald-400 uppercase tracking-widest font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Now
                  </span>
                ) : collection.status === 'scheduled' ? (
                  <span className="flex items-center gap-1 text-xs md:text-[9px] text-amber-400 uppercase tracking-widest font-medium">
                    <Calendar size={10} /> Coming Soon
                  </span>
                ) : (
                  <span className="text-xs md:text-[9px] text-white/50 uppercase tracking-widest">Archived</span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display italic uppercase tracking-tight text-white mb-4">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="max-w-xl text-xs md:text-sm text-white/70 leading-relaxed">
                  {collection.description}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. METADATA BAR */}
      <div className="bg-white border-b border-ink/5 shrink-0 z-20 shadow-sm relative">
        <div className="max-w-[1800px] mx-auto px-4 md:px-12 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/shop" className="group flex items-center gap-1.5 text-ink/40 hover:text-ink transition-colors">
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] hidden md:inline">Back to Catalog</span>
              <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] md:hidden">Catalog</span>
            </Link>
            <span className="text-ink/20">|</span>
            <div className="flex items-center gap-4">
              <span className="text-xs md:text-[10px] font-medium text-ink uppercase tracking-[0.2em]">{collection.name}</span>
              <span className="text-ink/20 hidden md:inline">/</span>
              <span className="text-[11px] md:text-[8px] text-ink/50 uppercase tracking-widest hidden md:inline">{products.length} Items</span>
            </div>
          </div>
          <div className="text-[11px] md:text-[8px] font-mono tracking-tighter text-ink/30 uppercase">
            NINOC-COL-{collection.id.substring(0, 6)}
          </div>
        </div>
      </div>

      {/* 3. PRODUCT GRID */}
      <section className="shrink-0 bg-white z-10 relative">
        <div className="max-w-[1800px] mx-auto px-4 md:px-12 py-4 md:py-6 h-auto">
          <AnimatePresence mode="wait">
            <motion.div
              variants={productGridVariants}
              initial="hidden"
              animate="visible"
              className="flex items-start gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-2"
            >
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="w-full py-8 md:py-12 flex flex-col items-center text-center">
                  <Package size={24} className="mx-auto mb-3 text-ink/20" />
                  <p className="text-xs md:text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
                    No items curated yet
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

    </main>
  );
}
