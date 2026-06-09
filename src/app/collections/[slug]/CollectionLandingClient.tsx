"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft, Package, Calendar } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useBrandColor } from '@/components/BrandProvider';
import { Collection, Product, CollectionProduct } from '@/components/admin/types';

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

  return (
    <motion.div
      variants={productCardVariants}
      whileHover="hover"
      whileTap="tap"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="block bg-white p-2 md:p-3 group relative overflow-hidden border border-transparent hover:border-ink/5"
      >
        <motion.div
          className="aspect-[3/4] bg-ink/5 relative mb-2 md:mb-3 overflow-hidden"
          animate={{ borderColor: isHovered ? 'rgba(20,20,20,0.1)' : 'rgba(20,20,20,0.05)' }}
          transition={{ duration: DURATION.fast }}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-6 md:p-10 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
              sizes="(max-width: 768px) 50vw, 25vw"
              style={{
                filter: isHovered ? 'blur(0px)' : 'blur(0px)',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
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
        </motion.div>

        <div className="space-y-0.5">
          <motion.span
            className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/25 block"
            animate={{ color: isHovered ? brandColor.color : 'rgba(20,20,20,0.25)' }}
            transition={{ duration: DURATION.fast }}
          >
            {product.category}
          </motion.span>
          <motion.h3
            className="text-[9px] md:text-[10px] font-display font-medium italic uppercase tracking-tight"
            animate={isHovered ? brandColor : darkColor}
            transition={{ duration: DURATION.fast }}
          >
            {product.name}
          </motion.h3>

          <motion.div
            className="flex items-center gap-1"
            animate={{ opacity: isHovered ? 1 : 0.6 }}
            transition={{ duration: DURATION.fast }}
          >
            <span className="text-[8px] md:text-[9px] font-medium text-ink/50">
              IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COLLECTION LANDING CLIENT
// ═══════════════════════════════════════════════════════════════

export default function CollectionLandingClient({ slug }: { slug: string }) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Collection
        const { data: colData, error: colError } = await supabase
          .from('collections')
          .select('*')
          .eq('slug', slug)
          .single();

        if (colError || !colData) {
          setIsNotFound(true);
          return;
        }

        setCollection(colData);

        // Fetch Products relation
        const { data: relData } = await supabase
          .from('collection_products')
          .select('product_id')
          .eq('collection_id', colData.id);

        if (relData && relData.length > 0) {
          const productIds = relData.map(r => r.product_id);
          const { data: prodData } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);
            
          if (prodData) {
            setProducts(prodData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch collection data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-cr noise pt-24 px-4 flex justify-center">
        <div className="w-8 h-8 border-2 border-ink/10 border-t-rose rounded-full animate-spin" />
      </main>
    );
  }

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
    <main className="min-h-screen bg-cr noise pb-[120px]">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[50vh] md:h-[70vh] bg-ink">
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
            <span className="text-[10px] uppercase tracking-[0.2em]">All Collections</span>
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
                <span className="px-2.5 py-1 text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-medium bg-white text-ink">
                  {collection.collection_type === 'smart' ? 'Smart Collection' : 'Curated Drop'}
                </span>
                {isOngoing && collection.status === 'active' ? (
                  <span className="flex items-center gap-1 text-[9px] text-emerald-400 uppercase tracking-widest font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Now
                  </span>
                ) : collection.status === 'scheduled' ? (
                  <span className="flex items-center gap-1 text-[9px] text-amber-400 uppercase tracking-widest font-medium">
                    <Calendar size={10} /> Coming Soon
                  </span>
                ) : (
                  <span className="text-[9px] text-white/50 uppercase tracking-widest">Archived</span>
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

      {/* 2. STICKY METADATA BAR */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-ink/5">
        <div className="max-w-[1800px] mx-auto px-4 md:px-12 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-medium text-ink uppercase tracking-[0.2em]">{collection.name}</span>
            <span className="text-ink/20 hidden md:inline">/</span>
            <span className="text-[8px] text-ink/50 uppercase tracking-widest hidden md:inline">{products.length} Items Indexed</span>
          </div>
          <div className="text-[8px] font-mono tracking-tighter text-ink/30 uppercase">
            NINOC-COL-{collection.id.substring(0, 6)}
          </div>
        </div>
      </div>

      {/* 3. PRODUCT GRID */}
      <section className="max-w-[1800px] mx-auto px-4 md:px-12 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            variants={productGridVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-ink/5 border border-ink/5"
          >
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-white">
                <Package size={32} className="mx-auto mb-4 text-ink/20" />
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40">
                  No items curated yet
                </p>
                <p className="text-[9px] text-ink/30 mt-2">
                  Products for this collection are still being prepared.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

    </main>
  );
}
