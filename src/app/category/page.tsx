"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence, Variants } from 'framer-motion';
import { Grid3X3, ChevronRight, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CategoryType } from '@/types';

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
};

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  slug: string;
  category: CategoryType;
  price_tag?: string | null;
}

const CATEGORIES = [
  { id: 'pakaian' as CategoryType, label: 'Pakaian', sublabel: 'Apparel', icon: PakaianIcon, description: 'Outerwear, tops & bottoms', spec: 'GARMENT-001' },
  { id: 'utilities' as CategoryType, label: 'Utilities', sublabel: 'Functional', icon: UtilitiesIcon, description: 'Bags, cases & gear', spec: 'UTIL-002' },
  { id: 'aksesoris' as CategoryType, label: 'Aksesoris', sublabel: 'Accents', icon: AksesorisIcon, description: 'Jewelry & details', spec: 'ACCS-003' },
];

// ═══════════════════════════════════════════════════════════════
// VARIANT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const categoryIndexVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: DURATION.medium, ease: EASING.out },
  }),
};

const productGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const productCardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: DURATION.medium, ease: EASING.out },
  },
  hover: {
    scale: 1.02,
    transition: { duration: DURATION.fast, ease: EASING.out },
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
  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      className={className}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return <button onClick={onClick}>{content}</button>;
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY CARD — Enhanced with hover states
// ═══════════════════════════════════════════════════════════════

function CategoryCard({ cat, index, isSelected, onClick }: {
  cat: typeof CATEGORIES[0];
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = cat.icon;

  return (
    <motion.button
      custom={index}
      variants={categoryIndexVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-white p-6 md:p-10 text-left group overflow-hidden ${isSelected ? 'bg-ink text-white' : ''}`}
    >
      {/* Background animation on hover */}
      <motion.div
        className="absolute inset-0 bg-rose origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{ duration: DURATION.medium, ease: EASING.out }}
        style={{ zIndex: 0 }}
      />

      {/* Content with z-index */}
      <div className="relative z-10">
        {/* Spec Badge */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4">
          <motion.span
            className={`text-[6px] font-mono tracking-tighter px-1 py-0.5 ${isSelected ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink/40'}`}
            animate={{ backgroundColor: isHovered ? 'rgba(255,255,255,0.2)' : isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.05)' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.spec}
          </motion.span>
        </div>

        {/* Icon */}
        <motion.div
          animate={{ color: isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#E8527A' }}
          transition={{ duration: DURATION.fast }}
        >
          <Icon />
        </motion.div>

        {/* Content */}
        <div className="space-y-1 md:space-y-2 mt-4 md:mt-6">
          <motion.h3
            className={`text-sm md:text-lg font-display font-medium italic uppercase tracking-tight ${isSelected ? 'text-white' : 'text-ink'}`}
            animate={{ color: isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#141414' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.label}
          </motion.h3>
          <motion.p
            className={`text-[8px] md:text-[9px] font-medium uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-ink/40'}`}
            animate={{ color: isSelected ? 'rgba(255,255,255,0.6)' : isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,20,0.4)' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.sublabel}
          </motion.p>
          <motion.p
            className={`text-[9px] md:text-[10px] font-medium leading-relaxed hidden md:block ${isSelected ? 'text-white/80' : 'text-ink/60'}`}
            animate={{ color: isSelected ? 'rgba(255,255,255,0.8)' : isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(20,20,20,0.6)' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.description}
          </motion.p>
        </div>

        {/* Arrow Indicator */}
        <motion.div
          className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 ${isSelected ? 'text-white' : 'text-ink/30'}`}
          animate={{ x: isSelected || isHovered ? 4 : 0, color: isSelected || isHovered ? '#ffffff' : 'rgba(20,20,20,0.3)' }}
          transition={{ duration: DURATION.fast }}
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </motion.div>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT CARD — With hover interactions
// ═══════════════════════════════════════════════════════════════

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);

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
              className="object-contain p-2 md:p-4 grayscale transition-all duration-700"
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

          {/* Spec Tag */}
          <motion.div
            className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-ink text-white px-1 py-0.5 text-[5px] md:text-[6px] uppercase tracking-tighter font-mono"
            animate={{ opacity: isHovered ? 0.7 : 1 }}
            transition={{ duration: DURATION.fast }}
          >
            {product.category.toUpperCase().slice(0, 4)}
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="space-y-1">
          <motion.p
            className="text-[6px] md:text-[7px] font-medium uppercase tracking-[0.15em] text-ink/30 hidden md:block"
            animate={{ opacity: isHovered ? 0.7 : 1 }}
            transition={{ duration: DURATION.fast }}
          >
            {CATEGORIES.find((c) => c.id === product.category)?.label}
          </motion.p>
          <motion.h3
            className="text-[9px] md:text-[11px] font-display font-medium italic uppercase tracking-tight text-ink truncate"
            animate={{ color: isHovered ? '#E8527A' : '#141414' }}
            transition={{ duration: DURATION.fast }}
          >
            {product.name}
          </motion.h3>
          <motion.div
            className="flex items-center justify-between pt-1 md:pt-2 border-t border-ink/5 mt-1 md:mt-2"
            animate={{ opacity: isHovered ? 1 : 0.8 }}
            transition={{ duration: DURATION.fast }}
          >
            <motion.span
              className="text-[8px] md:text-[10px] font-display font-medium italic text-rose"
              animate={{ scale: isHovered ? 1.02 : 1 }}
              transition={{ duration: DURATION.fast }}
            >
              IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
            </motion.span>
            {product.price_tag && (
              <motion.span
                className="text-[5px] md:text-[6px] font-medium uppercase tracking-[0.1em] text-emerald-600 hidden md:inline"
                animate={{ opacity: isHovered ? 1 : 0.7 }}
                transition={{ duration: DURATION.fast }}
              >
                {product.price_tag}
              </motion.span>
            )}
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY PAGE
// ═══════════════════════════════════════════════════════════════

export default function CategoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (selectedCategory) return products.filter((p) => p.category === selectedCategory);
    return products;
  }, [selectedCategory, products]);

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
    <main className="min-h-screen bg-cr noise pt-4 md:pt-32 px-4 md:px-12">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 md:mb-16">
          <div className="flex flex-col gap-1 md:gap-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.normal, ease: EASING.out }}
              className="flex items-center gap-2"
            >
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}>
                <Grid3X3 size={12} className="text-rose" />
              </motion.div>
              <span className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">Archival Catalog</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: DURATION.slow, ease: EASING.out }}
              className="text-2xl md:text-5xl font-display font-medium italic tracking-tighter uppercase text-ink leading-none"
            >
              Category Index
            </motion.h1>
          </div>

          {/* Mobile Back */}
          <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose">
            <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ArrowLeft size={12} />
            </motion.div>
            <span className="text-[8px] md:text-[9px] font-medium uppercase tracking-[0.3em]">Exit</span>
          </PressButton>
        </div>

        {/* CATEGORY INDEX — CELL-BLOCK GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/5 border border-ink/5 mb-12 md:mb-20">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={i}
              isSelected={selectedCategory === cat.id}
              onClick={() => {
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                gridRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ))}
        </div>

        {/* ACTIVE FILTER DISPLAY */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: DURATION.fast, ease: EASING.out }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/40">Filtering:</span>
                <motion.span
                  className="text-[10px] font-medium uppercase tracking-[0.2em] text-rose"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </motion.span>
              </div>
              <PressButton onClick={() => setSelectedCategory(null)} className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 hover:text-rose">
                Clear Filter
              </PressButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRODUCT GRID */}
        <div ref={gridRef} className="border-t border-ink/5 pt-8 md:pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory || 'all'}
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
                    No products in this category
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* STATS FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: DURATION.medium }}
          className="mt-16 md:mt-24 border-t border-ink/5 pt-6 md:pt-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-8">
            <motion.div
              className="space-y-0.5"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: DURATION.fast }}
            >
              <p className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Total Units</p>
              <p className="text-lg font-display font-medium italic text-ink">{products.length}</p>
            </motion.div>
            <div className="h-8 w-[1px] bg-ink/10 hidden md:block" />
            <motion.div
              className="space-y-0.5"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: DURATION.fast }}
            >
              <p className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Active Categories</p>
              <p className="text-lg font-display font-medium italic text-ink">{CATEGORIES.length}</p>
            </motion.div>
          </div>
          <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose">
            <span className="text-[9px] font-medium uppercase tracking-[0.3em]">Full Catalog</span>
            <motion.div animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ChevronRight size={14} />
            </motion.div>
          </PressButton>
        </motion.div>

      </div>
    </main>
  );
}