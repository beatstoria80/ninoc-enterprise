"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, ArrowRight, ImageOff, Eye } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getProductStock } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { isDiscountActive } from '@/lib/domain/product';
import { useDevice } from '@/app/checkout/_components/useDevice';
import ImageLightbox from '@/components/ImageLightbox';
import { getDictionaryByLocale, Locale } from '@/lib/i18n';
import { useCatalogViews } from '@/hooks/shop/useCatalogViews';
import { useShopFilters, DesktopShopFilterBar, MobileShopFilterBar, type ShopProduct as Product, type FilterSystemType } from './_components/ShopFilterSystem';
import { formatCategoryLabel } from '@/lib/departmentDomain';

function SafeImage({ src, alt, className, sizes, priority = false, draggable }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean; draggable?: boolean;
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
      draggable={draggable}
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

// Product type imported from ShopFilterSystem

function matchesCategoryPillar(productCategory: string, pillar: string): boolean {
  if (pillar === 'All') return true;
  if (!productCategory) return false;
  const cat = productCategory.toLowerCase().trim();
  if (pillar === 'Apparel') {
    return ['pakaian', 'apparel', 'fashion', 'garment', 'footwear', 'archive', 'shirts', 'outerwear', 'bottoms', 'accessories', 'aksesoris', 'tops', 'jacket', 'coat', 'pants', 'shoes', 'baju', 'celana', 'sepatu', 'topi', 'unisex', 'rok', 'skirt', 'dress', 'bawahan', 'jeans', 'trousers', 'shorts', 'cargo', 'kulot'].some(k => cat.includes(k));
  }
  if (pillar === 'Objects') {
    return ['utilities', 'home', 'kitchen', 'ceramics', 'collectibles', 'objects', 'goods', 'homeware', 'lifestyle', 'keramik', 'piring', 'gelas', 'botol', 'alat', 'rumah'].some(k => cat.includes(k));
  }
  if (pillar === 'Pantry') {
    return ['coffee', 'pastry', 'rtd', 'snack', 'beverage', 'pantry', 'cafe', 'roastery', 'food', 'drinks', 'kopi', 'kue', 'makanan', 'minuman', 'beans', 'roast'].some(k => cat.includes(k));
  }
  return cat === pillar.toLowerCase();
}

function getCategoryDisplayName(cat: string): string {
  if (cat === 'Objects') return 'Home & Living';
  if (cat === 'Pantry') return 'Pantry & Café';
  if (cat === 'All') return 'All';
  return cat;
}

function getDisplayImage(product: Product, selectedColor: string): string {
  if (selectedColor && selectedColor !== 'All') {
    const safeColor = selectedColor.trim().toUpperCase();
    const safeSpecs = Array.isArray(product.specifications) ? product.specifications : [];
    
    // 1. Check for Color Image: <Color>
    const mainSpec = safeSpecs.find((spec: any) => {
      if (!spec?.label || typeof spec.label !== 'string') return false;
      const match = spec.label.match(/^color\s*(image)?\s*:\s*(.+)$/i);
      return match && match[2].trim().toUpperCase() === safeColor && spec.value?.trim();
    });

    if (mainSpec?.value?.trim()) return mainSpec.value.trim();

    // 2. Check for Color P1: <Color>
    const p1Spec = safeSpecs.find((spec: any) => {
      if (!spec?.label || typeof spec.label !== 'string') return false;
      const match = spec.label.match(/^color\s*(p1|perspective1|1)?\s*:\s*(.+)$/i);
      return match && match[2].trim().toUpperCase() === safeColor && spec.value?.trim();
    });

    if (p1Spec?.value?.trim()) return p1Spec.value.trim();

    // 3. Check for variant image_url
    const safeVariants = Array.isArray(product.variants) ? product.variants : [];
    const varMatch = (safeVariants as any[]).find((v: any) => v.color?.trim().toUpperCase() === safeColor && v.image_url);
    if (varMatch?.image_url) return varMatch.image_url;
  }

  // Fallback
  return product.image_url || 
         product.perspective1 || 
         product.perspective2 || 
         product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorimage:') || s.label?.toLowerCase().startsWith('colorp1:'))?.value || 
         '';
}

function KithEmptyState({ selectedCategory, onReset }: { selectedCategory: string; onReset: () => void }) {
  const code = selectedCategory === 'Apparel' ? 'APR-01' : selectedCategory === 'Objects' ? 'OBJ-02' : selectedCategory === 'Pantry' ? 'PTR-03' : 'EMPTY';
  
  return (
    <div className="w-full border border-ink/10 bg-white p-8 md:p-20 text-center flex flex-col items-center justify-center min-h-[45vh] relative overflow-hidden my-6 shadow-sm rounded-none">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
        <span className="text-[80px] md:text-[180px] font-display font-bold italic tracking-tighter uppercase text-ink">
          {code}
        </span>
      </div>

      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-ink text-white font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em]">
          <span>PORTAL STATUS // {getCategoryDisplayName(selectedCategory).toUpperCase()}</span>
        </div>

        <h3 className="text-xl md:text-3xl font-display font-medium uppercase tracking-tight text-ink leading-tight">
          {selectedCategory === 'Apparel' && "Archive Empty — Garment Curation in Progress"}
          {selectedCategory === 'Objects' && "No Home & Living Items Listed — Studio Edition Dropping Soon"}
          {selectedCategory === 'Pantry' && "Roastery Closed — Fresh Batch Roast in Progress"}
          {selectedCategory === 'All' && "Catalog Currently Empty"}
        </h3>

        <p className="text-xs md:text-xs text-ink/60 font-mono tracking-wider leading-relaxed">
          We are currently cataloging new arrivals and archival pieces for this department. All items undergo stringent quality inspection prior to public release.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-3.5 bg-ink text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-rose transition-colors duration-300 rounded-none"
          >
            View All Departments
          </button>
          <Link
            href="/logbook"
            className="w-full sm:w-auto px-6 py-3.5 border border-ink/20 text-ink text-[11px] font-bold uppercase tracking-[0.2em] hover:border-ink hover:bg-ink/[0.03] transition-colors duration-300 inline-block rounded-none"
          >
            Read Editorial Logbook
          </Link>
        </div>
      </div>
    </div>
  );
}

function getProductPillar(productCategory: string): string {
  if (matchesCategoryPillar(productCategory, 'Apparel')) return 'Apparel';
  if (matchesCategoryPillar(productCategory, 'Objects')) return 'Objects';
  if (matchesCategoryPillar(productCategory, 'Pantry')) return 'Pantry';
  return 'Apparel';
}

import { FlashSaleBadge } from '@/components/shop/FlashSaleBadge';
import { FlashSaleItem, FlashSaleService } from '@/lib/domain/flashSale';

function MobileShopView({ filterSystem, dict, activeFlashSales }: { filterSystem: FilterSystemType, dict: any, activeFlashSales: any[] }) {
  const displayCategories = ['All', 'Apparel', 'Objects', 'Pantry'];
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const pathname = usePathname();
  const isId = !pathname?.startsWith('/en');
  const { allViews } = useCatalogViews();

  const getDisplayViews = (product: Product) => {
    if (allViews) {
      // Direct slug key lookup (API now returns slug-keyed accumulated views)
      const realViews = allViews[product.slug];
      if (realViews && realViews > 0) return realViews;
    }
    return 0;
  };

  const { filteredProducts, selectedCategory } = filterSystem;

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const pillar = getProductPillar(product.category);
    if (!acc[pillar]) {
      acc[pillar] = [];
    }
    acc[pillar].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="bg-cr min-h-screen">
      <MobileShopFilterBar filterSystem={filterSystem} />

      <div className="px-3 pt-1 md:pt-8 space-y-4 pb-10">
        {displayCategories
          .filter(c => c !== 'All' && (selectedCategory === 'All' || selectedCategory === c) && (groupedProducts[c]?.length || 0) > 0)
          .map((category) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between border-b border-ink/10 pb-1">
              <h2 className="text-[10px] font-display font-medium italic uppercase tracking-wider text-ink/80">
                {getCategoryDisplayName(category)}
              </h2>
              <span className="text-[8px] font-mono text-ink/40">
                ({groupedProducts[category]?.length || 0})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {groupedProducts[category]?.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Link href={`/shop/${product.slug}`} className="block h-full">
                    <div className="bg-white border border-ink/5 h-full flex flex-col justify-between p-2 relative group overflow-hidden">
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink/[0.02] mb-2">
                        <SafeImage
                          src={getDisplayImage(product, filterSystem.selectedColor)}
                          alt={product.name}
                          className="object-cover transition-transform duration-500 group-hover:scale-105 select-none pointer-events-none"
                          sizes="50vw"
                          draggable={false}
                        />
                        {FlashSaleService.evaluateFlashSalePricing(product.id, null, activeFlashSales) ? (
                          <FlashSaleBadge />
                        ) : (
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                            <div className="bg-ink text-white px-2 py-1 text-[8px] font-medium uppercase tracking-[0.25em] shadow-sm w-max">
                              {product.badge_text || 'STUDIO'}
                            </div>
                            {product.bundle_min_qty && product.bundle_discount_amount && !isDiscountActive(product) && (
                              <div className="bg-amber-500 text-white px-2 py-1 text-[8px] font-bold uppercase tracking-[0.25em] shadow-sm w-max">
                                GROSIR
                              </div>
                            )}
                          </div>
                        )}
                        {/* Program & Promo Badge — Top Right (Orange & White) */}
                        {isDiscountActive(product) && product.original_price ? (
                          <div className="absolute top-1.5 right-1.5 z-10 bg-[#FF6B00] text-white px-2 py-1 shadow-md pointer-events-none flex items-center gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                              -{Math.round(((product.original_price - (product.price || 0)) / product.original_price) * 100)}%
                            </span>
                          </div>
                        ) : product.price_tag ? (
                          <div className="absolute top-1.5 right-1.5 z-10 bg-[#FF6B00] text-white px-2 py-1 shadow-md pointer-events-none">
                            <span className="text-[8px] font-bold uppercase tracking-[0.15em] leading-none">
                              {product.price_tag}
                            </span>
                          </div>
                        ) : null}
                        
                        <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>

                      <div className="space-y-1.5 flex flex-col flex-grow justify-between">
                        <div>
                          <h3 className="text-[10px] font-display font-medium italic text-ink uppercase line-clamp-1 leading-snug">
                            {product.name}
                          </h3>
                          <p className="text-[7px] font-medium text-ink/40 uppercase tracking-widest mt-0.5">
                            {formatCategoryLabel(product.category)}
                          </p>
                        </div>

                        <div className="space-y-1.5 mt-auto pt-1">
                          <div className="flex items-center justify-between">
                            {product.price_tag === 'REDEEM' ? (
                              <span className="text-[11px] font-display font-bold italic text-emerald-700">
                                {(product.price ?? 0).toLocaleString('id-ID')} PTS
                              </span>
                            ) : (
                              <div className="flex flex-col">
                                {isDiscountActive(product) && product.original_price ? (
                                  <>
                                    <div className="flex items-center gap-1.5 -mb-0.5">
                                      <span className="bg-[#FF4500] text-white px-1 py-0.5 text-[7px] font-bold uppercase tracking-widest rounded-sm">
                                        -{Math.round(((product.original_price - (product.price || 0)) / product.original_price) * 100)}%
                                      </span>
                                      <span className="text-[9px] font-medium text-ink/40 line-through">
                                        IDR {(product.original_price ?? 0).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-display font-bold italic text-rose">
                                      IDR {(product.price ?? 0).toLocaleString('id-ID')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-display font-bold italic text-emerald-700">
                                    IDR {(product.price ?? 0).toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                            )}
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
                                                          <ShoppingBag className="w-4 h-4 md:w-3.5 md:h-3.5 pointer-events-none" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-ink/5">
                            <div className="flex items-center gap-1 text-ink/70" title="Google Analytics Realtime SKU Viewers">
                              <Eye className="w-2.5 h-2.5 text-rose shrink-0" />
                              <span className="text-[7px] font-mono font-semibold uppercase tracking-wider">
                                {getDisplayViews(product)} {isId ? 'DILIHAT' : 'VIEWS'}
                              </span>
                            </div>
                            <span className="text-[7px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                              {getProductStock(product)} {isId ? 'STOK' : 'STOCK'}
                            </span>
                          </div>
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
          <KithEmptyState selectedCategory={selectedCategory} onReset={() => filterSystem.resetFilters()} />
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

function DesktopShopView({ filterSystem, dict, activeFlashSales }: { filterSystem: FilterSystemType, dict: any, activeFlashSales: any[] }) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const pathname = usePathname();
  const isId = !pathname?.startsWith('/en');
  const { allViews } = useCatalogViews();

  const getDisplayViews = (product: Product) => {
    if (allViews) {
      // Direct slug key lookup (API now returns slug-keyed accumulated views)
      const realViews = allViews[product.slug];
      if (realViews && realViews > 0) return realViews;
    }
    return 0;
  };

  const { filteredProducts, selectedCategory } = filterSystem;

  return (
    <main className="min-h-screen bg-cr noise pb-40">
      <DesktopShopFilterBar filterSystem={filterSystem} />

      <div className="pt-10 md:pt-14" />

      <section className="mt-4 md:mt-6 px-6 md:px-12 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
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
                <Link  href={`/shop/${product.slug}`} className="block h-full">
                  <div className="bg-white border border-ink/5 shadow-sm hover:shadow-xl hover:border-ink/15 transition-all duration-300 h-full flex flex-col group/card relative overflow-hidden">

                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink/[0.02]">
                      <SafeImage
                        src={getDisplayImage(product, filterSystem.selectedColor)}
                        alt={product.name}
                        className="transition-transform duration-700 group-hover/card:scale-105 select-none pointer-events-none"
                        sizes="(max-width: 1280px) 25vw, 20vw"
                        draggable={false}
                      />

                      {FlashSaleService.evaluateFlashSalePricing(product.id, null, activeFlashSales) ? (
                        <div className="absolute top-0 left-0">
                           <FlashSaleBadge />
                        </div>
                      ) : (
                        <div className="absolute top-0 left-0 flex flex-col gap-1.5 z-10 pointer-events-none w-full">
                          <div className="bg-ink text-white px-2 py-1 text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] shadow-sm w-max">
                            {product.badge_text || 'STUDIO EDITION'}
                          </div>
                          {product.bundle_min_qty && product.bundle_discount_amount && !isDiscountActive(product) && (
                            <div className="bg-amber-500 text-white px-2 py-1 text-[10px] md:text-[7px] font-bold uppercase tracking-[0.3em] shadow-sm w-max">
                              GROSIR
                            </div>
                          )}
                        </div>
                      )}
                      {/* Program & Promo Badge — Top Right (Orange & White) */}
                      {isDiscountActive(product) && product.original_price ? (
                        <div className="absolute top-2 right-2 z-10 bg-[#FF6B00] text-white px-2.5 py-1 shadow-md pointer-events-none flex items-center gap-1">
                          <span className="text-[11px] md:text-[9px] font-bold uppercase tracking-wider leading-none">
                            -{Math.round(((product.original_price - (product.price || 0)) / product.original_price) * 100)}%
                          </span>
                        </div>
                      ) : product.price_tag ? (
                        <div className="absolute top-2 right-2 z-10 bg-[#FF6B00] text-white px-2.5 py-1 shadow-md pointer-events-none">
                          <span className="text-[10px] md:text-[8px] font-bold uppercase tracking-[0.15em] leading-none">
                            {product.price_tag}
                          </span>
                        </div>
                      ) : null}


                    </div>

                    <div className="p-2.5 flex flex-col flex-grow justify-between gap-2">
                      <div>
                        <h3 className="text-xs md:text-[10px] md:text-xs font-display font-medium italic tracking-tight text-ink uppercase leading-snug line-clamp-2 group-hover/card:text-rose transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs md:text-[9px] font-medium text-ink/50 uppercase tracking-[0.2em] mt-1">
                          {formatCategoryLabel(product.category)}
                        </p>
                      </div>

                      <div className="space-y-2 mt-auto">
                        {product.price_tag && (
                          <div className="flex items-center gap-1 border border-rose/20 px-1 py-0.5 bg-rose/[0.02] w-fit">
                            <span className="text-[7px] md:text-[6px] font-medium text-rose uppercase tracking-widest flex items-center gap-0.5">
                              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              {product.price_tag}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {product.price_tag === 'REDEEM' ? (
                              <div className="text-base md:text-sm font-display font-bold italic text-emerald-700">
                                {(product.price ?? 0).toLocaleString('id-ID')} PTS
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                {isDiscountActive(product) && product.original_price ? (
                                  <>
                                    <div className="flex items-center gap-1.5 -mb-1">
                                      <span className="bg-[#FF4500] text-white px-1.5 py-0.5 text-[7px] md:text-[6.5px] font-bold uppercase tracking-widest rounded-sm">
                                        -{Math.round(((product.original_price - (product.price || 0)) / product.original_price) * 100)}%
                                      </span>
                                      <span className="text-[10px] md:text-[9px] font-medium text-ink/40 line-through">
                                        IDR {(product.original_price ?? 0).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                    <div className="text-base md:text-sm font-display font-bold italic text-rose">
                                      IDR {(product.price ?? 0).toLocaleString('id-ID')}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-base md:text-sm font-display font-bold italic text-emerald-700">
                                    IDR {(product.price ?? 0).toLocaleString('id-ID')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
                            }}
                            className="w-8 h-8 md:w-8 md:h-8 bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-colors duration-200 cursor-pointer relative z-20"
                          >
                            <ShoppingBag className="w-4 h-4 md:w-4 md:h-4 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                          <div className="flex items-center gap-1.5 text-ink/70 group-hover/card:text-rose transition-colors" title="Google Analytics Realtime SKU Viewers">
                            <Eye className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose shrink-0" />
                            <span className="text-[10px] md:text-[8px] font-mono font-semibold uppercase tracking-wider">
                              {getDisplayViews(product)} {isId ? 'DILIHAT' : 'VIEWS'}
                            </span>
                          </div>
                          <span className="text-[10px] md:text-[8px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                            {getProductStock(product)} {isId ? 'STOK' : 'STOCK'}
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
          <KithEmptyState selectedCategory={selectedCategory} onReset={() => filterSystem.resetFilters()} />
        )}
      </section>
    </main>
  );
}

function ShopContent({ initialProducts, activeFlashSales }: { initialProducts: Product[], activeFlashSales: any[] }) {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const allowedCategories = ['All', 'Apparel', 'Objects', 'Pantry'];
  const initialCategory = filterParam && allowedCategories.includes(filterParam) ? filterParam : 'All';

  const { isMobile } = useDevice();

  return <ShopClientInner key={initialCategory} initialCategory={initialCategory} isMobile={isMobile} initialProducts={initialProducts} activeFlashSales={activeFlashSales} />;
}

function ShopClientInner({ initialCategory, isMobile, initialProducts, activeFlashSales }: { initialCategory: string; isMobile: boolean | null; initialProducts: Product[]; activeFlashSales: any[] }) {
  const pathname = usePathname();
  const lang: Locale = pathname?.startsWith('/en') ? 'EN' : 'ID';
  const dict = getDictionaryByLocale(lang);

  const filterSystem = useShopFilters(initialProducts, initialCategory);

  if (isMobile) {
    return <MobileShopView filterSystem={filterSystem} dict={dict} activeFlashSales={activeFlashSales} />;
  }

  return <DesktopShopView filterSystem={filterSystem} dict={dict} activeFlashSales={activeFlashSales} />;
}

export default function ShopClient({ initialProducts = [], activeFlashSales = [] }: { initialProducts?: Product[]; activeFlashSales?: any[] }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cr flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose/20 border-t-rose rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs md:text-[10px] text-ink/50 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    }>
      <ShopContent initialProducts={initialProducts} activeFlashSales={activeFlashSales} />
    </Suspense>
  );
}
