"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Layers, ChevronRight, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useBrandColor } from '@/components/BrandProvider';

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

// ═══════════════════════════════════════════════════════════════
// COLLECTION DEFINITIONS
// ═══════════════════════════════════════════════════════════════

type CollectionType = 'staples' | 'limited' | 'throwback';

interface CollectionDef {
  id: CollectionType;
  label: string;
  sublabel: string;
  description: string;
  icon: React.FC;
  spec: string;
}

const COLLECTIONS: CollectionDef[] = [
  {
    id: 'staples',
    label: 'Staples',
    sublabel: 'Core',
    description: 'Everyday essential fits',
    icon: HangerIcon,
    spec: 'CORE-001',
  },
  {
    id: 'limited',
    label: 'Limited',
    sublabel: 'Drop',
    description: 'Gone when gone',
    icon: FlameIcon,
    spec: 'DROP-002',
  },
  {
    id: 'throwback',
    label: 'Throwback',
    sublabel: 'Archive',
    description: 'Previous season pieces',
    icon: ClockRewindIcon,
    spec: 'ARCH-003',
  },
];

// ═══════════════════════════════════════════════════════════════
// VARIANT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

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
// COLLECTION CARD — Compact inline (matches CategoryCard)
// ═══════════════════════════════════════════════════════════════

function CollectionCard({ col, isSelected, onClick }: {
  col: CollectionDef;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const white = '#ffffff';
  const Icon = col.icon;

  return (
    <motion.button
      variants={collectionIndexVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-white py-1.5 px-2.5 md:py-2 md:px-3 text-left group overflow-hidden flex items-center gap-2.5 md:gap-3 ${isSelected ? 'bg-ink text-white' : ''}`}
    >
      {/* Background animation on hover */}
      <motion.div
        className="absolute inset-0 bg-rose origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{ duration: DURATION.medium, ease: EASING.out }}
        style={{ zIndex: 0 }}
      />

      {/* Content — single-row inline */}
      <div className="relative z-10 flex items-center gap-2 md:gap-3 w-full">
        {/* Icon */}
        <motion.div
          className="flex-shrink-0"
          animate={{ color: isSelected ? white : isHovered ? white : brandColor.color }}
          transition={{ duration: DURATION.fast }}
        >
          <Icon />
        </motion.div>

        {/* Label + Sublabel */}
        <div className="flex items-center gap-1.5 min-w-0">
          <motion.h3
            className={`text-[10px] md:text-xs font-display font-medium italic uppercase tracking-tight whitespace-nowrap ${isSelected ? 'text-white' : 'text-ink'}`}
            animate={{ color: isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#141414' }}
            transition={{ duration: DURATION.fast }}
          >
            {col.label}
          </motion.h3>
          <motion.span
            className={`text-[7px] md:text-[8px] font-medium uppercase tracking-widest whitespace-nowrap ${isSelected ? 'text-white/50' : 'text-ink/25'}`}
            animate={{ color: isSelected ? 'rgba(255,255,255,0.5)' : isHovered ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,20,0.25)' }}
            transition={{ duration: DURATION.fast }}
          >
            — {col.sublabel}
          </motion.span>
        </div>

        {/* Spec Badge */}
        <motion.span
          className={`ml-auto text-[6px] font-mono tracking-tighter px-1 py-0.5 flex-shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink/30'}`}
          animate={{ backgroundColor: isHovered ? 'rgba(255,255,255,0.2)' : isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.05)' }}
          transition={{ duration: DURATION.fast }}
        >
          {col.spec}
        </motion.span>

        {/* Arrow */}
        <motion.div
          className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-ink/20'}`}
          animate={{ x: isSelected || isHovered ? 2 : 0, color: isSelected || isHovered ? '#ffffff' : 'rgba(20,20,20,0.2)' }}
          transition={{ duration: DURATION.fast }}
        >
          <ChevronRight size={12} strokeWidth={1.5} />
        </motion.div>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT CARD — With hover interactions
// ═══════════════════════════════════════════════════════════════

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  category: string;
  is_featured: boolean;
  price_tag?: string;
}

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };

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
        {/* Image Container */}
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
              className="object-contain p-2 md:p-4 transition-all duration-700"
              style={{
                filter: isHovered ? 'grayscale(0%)' : 'grayscale(0%)',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink/10">
              <Package size={24} />
            </div>
          )}

          {/* Featured badge */}
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

        {/* Info */}
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

          {/* Price */}
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
// COLLECTIONS PAGE
// ═══════════════════════════════════════════════════════════════

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<CollectionType | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // For now, collections map to product features:
  // staples = not featured (everyday), limited = featured (exclusive), throwback = all
  const filteredProducts = useMemo(() => {
    if (!selectedCollection) return products;
    switch (selectedCollection) {
      case 'staples':
        return products.filter((p) => !p.is_featured);
      case 'limited':
        return products.filter((p) => p.is_featured);
      case 'throwback':
        return products; // All products
      default:
        return products;
    }
  }, [selectedCollection, products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('*');
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
    <main className="min-h-screen bg-cr noise pt-4 md:pt-20 px-4 md:px-12 pb-[120px]">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.normal, ease: EASING.out }}
            className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40 flex items-center gap-2"
          >
            <Layers size={10} className="text-rose" />
            Collection Index
          </motion.h1>

          <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose">
            <ArrowLeft size={10} className="rotate-180" />
            <span className="text-[7px] md:text-[8px] font-medium uppercase tracking-[0.3em]">Exit</span>
          </PressButton>
        </div>

        {/* COLLECTION INDEX — COMPACT INLINE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/5 border border-ink/5 mb-3 md:mb-4">
          {COLLECTIONS.map((col) => (
            <CollectionCard
              key={col.id}
              col={col}
              isSelected={selectedCollection === col.id}
              onClick={() => {
                setSelectedCollection(selectedCollection === col.id ? null : col.id);
                gridRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ))}
        </div>

        {/* ACTIVE FILTER DISPLAY */}
        <AnimatePresence>
          {selectedCollection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: DURATION.fast, ease: EASING.out }}
              className="flex items-center justify-between py-1.5 overflow-hidden mb-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30">Filtering:</span>
                <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-rose">{COLLECTIONS.find((c) => c.id === selectedCollection)?.label}</span>
              </div>
              <PressButton onClick={() => setSelectedCollection(null)} className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/30 hover:text-rose">
                Clear
              </PressButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRODUCT GRID */}
        <div ref={gridRef} className="border-t border-ink/5 pt-2 md:pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCollection || 'all'}
              variants={productGridVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.normal }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-ink/5"
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
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-16 text-center"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/20">
                    No products in this collection
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
                <p className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Total Items</p>
                <p className="text-lg font-display font-medium italic text-ink">{products.length}</p>
              </motion.div>
              <div className="h-8 w-[1px] bg-ink/10 hidden md:block" />
              <motion.div
                className="space-y-0.5"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <p className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Collections</p>
                <p className="text-lg font-display font-medium italic text-ink">{COLLECTIONS.length}</p>
              </motion.div>
            </div>
            <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose">
              <span className="text-[9px] font-medium uppercase tracking-[0.3em]">Full Catalog</span>
              <ChevronRight size={14} />
            </PressButton>
          </div>
        </motion.div>

      </div>
    </main>
  );
}