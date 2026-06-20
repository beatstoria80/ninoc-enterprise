"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, ArrowRight, ImageOff, ShoppingCart } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import ImageLightbox from '@/components/ImageLightbox';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';

function SafeImage({ src, alt, className, sizes, priority = false }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/[0.03] text-ink/20">
        <ImageOff size={24} />
        <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-widest">Image Unavailable</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes={sizes || "(max-width: 768px) 50vw, 25vw"}
      priority={priority}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

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
  badge_text?: string | null;
}

function MobileShopView({ products, initialCategory, dict }: { products: Product[], initialCategory: string, dict: any }) {
  const categoryMap: Record<string, string> = {
    'All': 'All',
    'Fashion': 'pakaian',
    'Utilities': 'utilities',
    'Accessories': 'aksesoris',
  };
  const displayCategories = Object.keys(categoryMap);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === categoryMap[selectedCategory]);

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="bg-cr min-h-screen">
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b border-ink/5">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs md:text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-all",
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

      <div className="px-3 pt-3 space-y-4 pb-10">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm md:text-[11px] font-display font-medium italic uppercase tracking-widest text-ink">
                {category}
              </h2>
              <span className="text-[10px] md:text-[9px] text-ink/30 uppercase tracking-wider">
                {categoryProducts.length} {dict.shop.pieces}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {categoryProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link prefetch={false} href={`/shop/${product.slug}`} className="block h-full border border-ink/5 bg-white shadow-sm flex flex-col">
                    <div
                      className="aspect-square bg-ink/[0.02] rounded-none overflow-hidden border-b border-ink/5 relative"
                    >
                      <SafeImage
                        src={product.image_url}
                        alt={product.name}
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {product.price_tag && (
                        <div className="absolute top-1 right-1 bg-white/95 backdrop-blur-sm text-rose border border-rose/10 px-1 py-0.5 text-[6px] font-medium uppercase tracking-[0.2em] shadow-sm z-10">
                          {product.price_tag}
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 space-y-1.5 flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="text-xs md:text-[10px] font-semibold uppercase tracking-tight text-ink line-clamp-2 leading-snug">
                          {product.name}
                        </h3>
                        <p className="text-[9px] md:text-[7px] font-semibold text-ink/60 uppercase tracking-[0.2em] mt-0.5">
                          {product.category}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs md:text-[11px] font-display font-medium italic text-rose">
                            {product.price_tag === 'REDEEM'
                              ? `${(product.price ?? 0).toLocaleString('id-ID')} PTS`
                              : `IDR ${(product.price ?? 0).toLocaleString('id-ID')}`}
                          </p>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
                            }}
                            className="w-8 h-8 md:w-6 md:h-6 bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-ink/5">
                          <div className="flex items-center gap-1 opacity-40">
                            <ArrowRight size={7} />
                            <span className="text-[6px] font-medium uppercase tracking-[0.2em]">{dict.shop.viewSpec}</span>
                          </div>
                          <span className="text-[6px] font-medium text-emerald-600 uppercase tracking-[0.2em]">
                            {dict.shop.available}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-xs md:text-[11px] text-ink/30 uppercase tracking-wider">{dict.shop.notFound}</p>
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

function DesktopShopView({ products, initialCategory, dict }: { products: Product[], initialCategory: string, dict: any }) {
  const categoryMap: Record<string, string> = {
    'All': 'All',
    'Fashion': 'pakaian',
    'Utilities': 'utilities',
    'Accessories': 'aksesoris',
  };
  const displayCategories = Object.keys(categoryMap);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All');

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === categoryMap[selectedCategory]);

  return (
    <main className="min-h-screen bg-cr noise pb-40">
      <div className="fixed top-24 left-6 md:left-12 z-[90] pointer-events-none">
        <section className="pointer-events-auto">
          <div className="glass border border-ink/5 rounded-full p-2 flex items-center gap-2 shadow-2xl shadow-ink/5 overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
              {displayCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs md:text-[10px] font-medium uppercase tracking-widest transition-all whitespace-nowrap",
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

      <div className="pt-40 md:pt-48" />

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
                <Link prefetch={false} href={`/shop/${product.slug}`} className="block h-full">
                  <div className="bg-white border border-ink/5 shadow-sm hover:shadow-xl hover:border-ink/15 transition-all duration-300 h-full flex flex-col group/card relative overflow-hidden">

                    <div className="relative aspect-square w-full overflow-hidden bg-ink/[0.02]">
                      <SafeImage
                        src={product.image_url}
                        alt={product.name}
                        className="transition-transform duration-700 group-hover/card:scale-105"
                        sizes="(max-width: 1280px) 25vw, 20vw"
                      />

                      <div className="absolute top-0 left-0 bg-ink text-white px-2 py-1 text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] z-10 shadow-sm">
                        {product.badge_text || 'STUDIO EDITION'}
                      </div>

                      {product.price_tag && (
                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm text-rose border border-rose/10 px-2 py-1 text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] shadow-sm z-10">
                          {product.price_tag}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
                          }}
                          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-ink scale-95 opacity-0 group-hover/card:scale-100 group-hover/card:opacity-100 transition-all duration-200 ease-out shadow-xl hover:bg-rose hover:text-white"
                        >
                          <ShoppingBag size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 flex flex-col flex-grow justify-between gap-2">
                      <div>
                        <h3 className="text-xs md:text-[10px] md:text-xs font-display font-medium italic tracking-tight text-ink uppercase leading-snug line-clamp-2 group-hover/card:text-rose transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs md:text-[9px] font-medium text-ink/30 uppercase tracking-[0.2em] mt-1">
                          {product.category}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {product.price_tag === 'REDEEM' ? (
                          <div className="text-xs md:text-[10px] md:text-xs font-display font-medium italic text-rose">
                            {(product.price ?? 0).toLocaleString('id-ID')} POINTS
                          </div>
                        ) : (
                          <div className="text-xs md:text-[10px] md:text-xs font-display font-medium italic text-rose">
                            IDR {(product.price ?? 0).toLocaleString('id-ID')}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1.5 border-t border-ink/5">
                          <div className="flex items-center gap-1.5 opacity-40">
                            <ArrowRight size={10} className="group-hover/card:translate-x-1 group-hover/card:text-rose transition-all" />
                            <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em]">{dict.shop.viewSpec}</span>
                          </div>
                          <span className="text-[11px] md:text-[8px] font-medium text-emerald-600 uppercase tracking-[0.2em]">
                            {dict.shop.available}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-40 text-center space-y-6 opacity-20">
            <Search size={64} className="mx-auto" />
            <p className="text-xl font-medium uppercase tracking-[0.4em]">{dict.shop.notFound}</p>
          </div>
        )}
      </section>
    </main>
  );
}

function ShopContent({ initialProducts }: { initialProducts: Product[] }) {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const allowedCategories = ['All', 'Fashion', 'Utilities', 'Accessories'];
  const initialCategory = filterParam && allowedCategories.includes(filterParam) ? filterParam : 'All';

  const { isMobile } = useDevice();

  return <ShopClientInner initialCategory={initialCategory} isMobile={isMobile} initialProducts={initialProducts} />;
}

function ShopClientInner({ initialCategory, isMobile, initialProducts }: { initialCategory: string; isMobile: boolean | null; initialProducts: Product[] }) {
  const pathname = usePathname();
  const lang: Locale = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(lang);

  const products = initialProducts;

  if (isMobile) {
    return <MobileShopView products={products} initialCategory={initialCategory} dict={dict} />;
  }

  return <DesktopShopView products={products} initialCategory={initialCategory} dict={dict} />;
}

export default function ShopClient({ initialProducts = [] }: { initialProducts?: Product[] }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cr flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose/20 border-t-rose rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs md:text-[10px] text-ink/30 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    }>
      <ShopContent initialProducts={initialProducts} />
    </Suspense>
  );
}