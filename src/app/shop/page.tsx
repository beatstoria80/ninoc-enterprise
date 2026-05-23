"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import ImageLightbox from '@/components/ImageLightbox';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  price_tag?: string | null;
}

// ===============================
// MOBILE SHOP VIEW (iOS Native)
// ===============================
function MobileShopView({ products }: { products: Product[] }) {
  // Category keys must match DB values: 'pakaian' | 'utilities' | 'aksesoris'
  const categoryMap: Record<string, string> = {
    'All': 'All',
    'Fashion': 'pakaian',
    'Utilities': 'utilities',
    'Accessories': 'aksesoris',
  };
  const displayCategories = Object.keys(categoryMap);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === categoryMap[selectedCategory]);

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="bg-cr min-h-screen">
      {/* Category Pills - Adjusted top for global MobileLayout header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-ink/5">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-all",
                selectedCategory === cat
                  ? "bg-rose text-white"
                  : "bg-ink/5 text-ink/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4 space-y-6 pb-20">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-display font-medium italic uppercase tracking-widest text-ink">
                {category}
              </h2>
              <span className="text-[9px] text-ink/30 uppercase tracking-wider">
                {categoryProducts.length} pieces
              </span>
            </div>

            {/* Products Grid - 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              {categoryProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/shop/${product.slug}`} className="block">
                    {/* Image */}
                    <div 
                      className="aspect-square bg-white rounded-none overflow-hidden border border-ink/5 relative"
                      onClick={(e) => {
                        e.preventDefault();
                        setFullscreenImage(product.image_url);
                      }}
                    >
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    {/* Info */}
                    <div className="mt-2 space-y-0.5">
                      <h3 className="text-[10px] font-medium uppercase tracking-tight text-ink line-clamp-1">
                        {product.name}
                      </h3>
                      {product.price_tag && (
                        <div className="text-[8px] font-medium uppercase tracking-[0.2em] text-rose">
                          {product.price_tag}
                        </div>
                      )}
                      <p className="text-[11px] font-display font-medium italic text-rose">
                        IDR {(product.price ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[11px] text-ink/30 uppercase tracking-wider">No products found</p>
          </div>
        )}
      </div>

      <ImageLightbox
        isOpen={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </div>
  );
}

// ===============================
// DESKTOP SHOP VIEW
// ===============================
function DesktopShopView({ products }: { products: Product[] }) {
  // Category keys must match DB values: 'pakaian' | 'utilities' | 'aksesoris'
  const categoryMap: Record<string, string> = {
    'All': 'All',
    'Fashion': 'pakaian',
    'Utilities': 'utilities',
    'Accessories': 'aksesoris',
  };
  const displayCategories = Object.keys(categoryMap);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === categoryMap[selectedCategory]);

  return (
    <main className="min-h-screen bg-cr noise pb-40">
      {/* TOP LEFT FIXED CATEGORY NAVIGATION */}
      <div className="fixed top-24 left-6 md:left-12 z-[90] pointer-events-none">
        <section className="pointer-events-auto">
          <div className="glass border border-ink/5 rounded-full p-2 flex items-center gap-2 shadow-2xl shadow-ink/5 overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
              {displayCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-medium uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedCategory === cat
                      ? "bg-ink text-white shadow-xl shadow-ink/20"
                      : "text-ink/40 hover:bg-ink/5 hover:text-ink backdrop-blur-sm"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Spacer */}
      <div className="pt-40 md:pt-48" />

      {/* PRODUCT GRID */}
      <section className="mt-12 px-6 md:px-12 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 lg:gap-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group"
              >
                <Link href={`/shop/${product.slug}`} className="block space-y-6">
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] rounded-[10px] overflow-hidden bg-white border border-ink/5 shadow-dashboard group-hover:shadow-2xl transition-all duration-500">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-ink scale-0 group-hover:scale-100 transition-transform duration-500 delay-100 shadow-2xl">
                        <ShoppingBag size={24} />
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-6 right-6">
                      <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl">
                        <p className="text-[10px] font-medium text-rose">NEW</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="px-4 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm md:text-lg font-display font-medium italic tracking-tight text-ink uppercase leading-tight group-hover:text-rose transition-colors">
                        {product.name}
                      </h3>
                      <ArrowRight size={16} className="text-ink/10 group-hover:text-rose group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[10px] font-medium text-ink/30 uppercase tracking-[0.2em]">
                      {product.category}
                    </p>
                    {product.price_tag && (
                      <div className="text-[8px] font-medium uppercase tracking-[0.2em] text-rose pt-1">
                        {product.price_tag}
                      </div>
                    )}
                    <p className="text-base md:text-xl font-display font-medium italic text-rose pt-2">
                      IDR {(product.price ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* EMPTY STATE */}
        {filteredProducts.length === 0 && (
          <div className="py-40 text-center space-y-6 opacity-20">
            <Search size={64} className="mx-auto" />
            <p className="text-xl font-medium uppercase tracking-[0.4em]">No Pieces Found</p>
          </div>
        )}
      </section>
    </main>
  );
}

// ===============================
// MAIN SHOP PAGE
// ===============================
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Platform detection - starts as MOBILE to prevent SSR flash
  const { isMobile } = useDevice();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;
        setProducts(data || []);
      } catch (error: unknown) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cr flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose/20 border-t-rose rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] text-ink/30 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  // SEPARATE UI PER PLATFORM
  // Mobile (iOS Native Feel)
  if (isMobile) {
    return <MobileShopView products={products} />;
  }

  // Desktop (Original Design)
  return <DesktopShopView products={products} />;
}