"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Grid3X3, Shirt, Wrench, Sparkles, ChevronRight, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CategoryType } from '@/types';

const MOTION = {
  ease: [0.16, 1, 0.3, 1] as const,
  duration: 0.6,
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
  {
    id: 'pakaian' as CategoryType,
    label: 'Pakaian',
    sublabel: 'Apparel',
    icon: Shirt,
    description: 'Outerwear, tops & bottoms',
    spec: 'GARMENT-001',
  },
  {
    id: 'utilities' as CategoryType,
    label: 'Utilities',
    sublabel: 'Functional',
    icon: Wrench,
    description: 'Bags, cases & gear',
    spec: 'UTIL-002',
  },
  {
    id: 'aksesoris' as CategoryType,
    label: 'Aksesoris',
    sublabel: 'Accents',
    icon: Sparkles,
    description: 'Jewelry & details',
    spec: 'ACCS-003',
  },
];

const categoryIndexVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: MOTION.duration, ease: MOTION.ease },
  }),
};

const productGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const productCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

export default function CategoryPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (selectedCategory) {
      return products.filter((p) => p.category === selectedCategory);
    }
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
    <main className="min-h-screen bg-cr noise pt-20 md:pt-32 px-4 md:px-12">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 md:mb-16">
          <div className="flex flex-col gap-1 md:gap-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: MOTION.ease }}
              className="flex items-center gap-2"
            >
              <Grid3X3 size={12} className="text-rose" />
              <span className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">Archival Catalog</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: MOTION.ease }}
              className="text-2xl md:text-5xl font-display font-medium italic tracking-tighter uppercase text-ink leading-none"
            >
              Category Index
            </motion.h1>
          </div>

          {/* Mobile Back */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose transition-colors">
              <ArrowLeft size={12} />
              <span className="text-[8px] md:text-[9px] font-medium uppercase tracking-[0.3em]">Exit</span>
            </Link>
          </motion.div>
        </div>

        {/* CATEGORY INDEX — CELL-BLOCK GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/5 border border-ink/5 mb-12 md:mb-20">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                custom={i}
                variants={categoryIndexVariants}
                initial="hidden"
                animate="visible"
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                  gridRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`
                  relative bg-white p-6 md:p-10 text-left group transition-all duration-300
                  hover:bg-rose hover:text-white
                  ${selectedCategory === cat.id ? 'bg-ink text-white' : ''}
                `}
              >
                {/* Spec Badge */}
                <div className="absolute top-2 right-2 md:top-4 md:right-4">
                  <span className={`text-[6px] font-mono tracking-tighter px-1 py-0.5 ${selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink/40 group-hover:bg-white/20 group-hover:text-white'} transition-all`}>
                    {cat.spec}
                  </span>
                </div>

                {/* Icon */}
                <div className={`mb-4 md:mb-6 ${selectedCategory === cat.id ? 'text-white' : 'text-rose'}`}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="space-y-1 md:space-y-2">
                  <h3 className={`text-sm md:text-lg font-display font-medium italic uppercase tracking-tight ${selectedCategory === cat.id ? 'text-white' : 'text-ink'}`}>
                    {cat.label}
                  </h3>
                  <p className={`text-[8px] md:text-[9px] font-medium uppercase tracking-widest ${selectedCategory === cat.id ? 'text-white/60' : 'text-ink/40'}`}>
                    {cat.sublabel}
                  </p>
                  <p className={`text-[9px] md:text-[10px] font-medium leading-relaxed ${selectedCategory === cat.id ? 'text-white/80' : 'text-ink/60'} hidden md:block`}>
                    {cat.description}
                  </p>
                </div>

                {/* Arrow Indicator */}
                <div className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 ${selectedCategory === cat.id ? 'text-white' : 'text-ink/30 group-hover:text-white'}`}>
                  <motion.div animate={{ x: selectedCategory === cat.id ? 4 : 0 }}>
                    <ChevronRight size={16} strokeWidth={1.5} />
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ACTIVE FILTER DISPLAY */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/40">Filtering:</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-rose">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </span>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 hover:text-rose transition-colors"
            >
              Clear Filter
            </button>
          </motion.div>
        )}

        {/* PRODUCT GRID — COMPACT CELL-BLOCK */}
        <div ref={gridRef} className="border-t border-ink/5 pt-8 md:pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory || 'all'}
              variants={productGridVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-ink/5"
            >
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <div key={i} className="bg-white aspect-[3/4] animate-pulse" />
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={productCardVariants}
                  >
                    <Link
                      href={`/shop/${product.slug}`}
                      className="block bg-white p-2 md:p-3 group relative overflow-hidden border border-transparent hover:border-ink/5 transition-all duration-500"
                    >
                      {/* Image Container */}
                      <div className="aspect-[3/4] bg-ink/5 relative mb-2 md:mb-3 overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-contain p-2 md:p-4 grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-ink/10">
                            <Package size={24} />
                          </div>
                        )}
                        {/* Spec Tag */}
                        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-ink text-white px-1 py-0.5 text-[5px] md:text-[6px] uppercase tracking-tighter font-mono">
                          {product.category.toUpperCase().slice(0, 4)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <p className="text-[6px] md:text-[7px] font-medium uppercase tracking-[0.15em] text-ink/30 hidden md:block">
                          {CATEGORIES.find((c) => c.id === product.category)?.label}
                        </p>
                        <h3 className="text-[9px] md:text-[11px] font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-rose transition-colors truncate">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between pt-1 md:pt-2 border-t border-ink/5 mt-1 md:mt-2">
                          <span className="text-[8px] md:text-[10px] font-display font-medium italic text-rose">
                            IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                          </span>
                          {product.price_tag && (
                            <span className="text-[5px] md:text-[6px] font-medium uppercase tracking-[0.1em] text-emerald-600 hidden md:inline">
                              {product.price_tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/20">
                    No products in this category
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* STATS FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 md:mt-24 border-t border-ink/5 pt-6 md:pt-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-8">
            <div className="space-y-0.5">
              <p className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Total Units</p>
              <p className="text-lg font-display font-medium italic text-ink">{products.length}</p>
            </div>
            <div className="h-8 w-[1px] bg-ink/10 hidden md:block" />
            <div className="space-y-0.5">
              <p className="text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Active Categories</p>
              <p className="text-lg font-display font-medium italic text-ink">{CATEGORIES.length}</p>
            </div>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 text-ink/40 hover:text-rose transition-colors"
          >
            <span className="text-[9px] font-medium uppercase tracking-[0.3em]">Full Catalog</span>
            <ChevronRight size={14} />
          </Link>
        </motion.div>

      </div>
    </main>
  );
}