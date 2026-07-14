"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { ShoppingBag, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, ChevronLeft, Ruler, Plus, Minus, Trash2, X, ImageOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { useCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import ImageLightbox from '@/components/ImageLightbox';
import type { Dictionary } from '@/lib/i18n';
import { ProductReviewsDrawer } from '@/components/shop/ProductReviewsDrawer';
import { useProductSelection } from '@/hooks/shop/useProductSelection';
import ProductGallery from '@/components/shop/ProductGallery';
import ImmersiveProductView from '@/components/shop/ImmersiveProductView';
import { CartSidebar } from '../_components/CartSidebar';
import { RelatedProductsList } from '../_components/RelatedProductsList';

export function getWeightAndHeight(size: string) {
  const s = size.toUpperCase();
  if (s === 'S' || s === '28') return { w: '45-55kg', h: '150-160cm' };
  if (s === 'M' || s === '30') return { w: '55-65kg', h: '160-170cm' };
  if (s === 'L' || s === '32') return { w: '65-75kg', h: '170-175cm' };
  if (s === 'XL' || s === '34') return { w: '75-85kg', h: '175-180cm' };
  if (s === 'XXL' || s === '36') return { w: '85-95kg', h: '180-185cm' };
  if (s === '3XL' || s === '38') return { w: '95-105kg', h: '185-190cm' };
  if (s === '4XL' || s === '40') return { w: '105-115kg', h: '190-195cm' };
  if (s === '5XL' || s === '42') return { w: '115-125kg', h: '195-200cm' };
  return { w: '-', h: '-' };
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.2, staggerChildren: 0.2 }
  }
};

const columnVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { duration: 1.2, ease: [0.23, 1, 0.32, 1], staggerChildren: 0.08, delayChildren: 0.1 } 
  }
};

const imageVariants: Variants = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  visible: { clipPath: 'inset(0 0 0 0)', transition: { duration: 1.5, ease: [0.77, 0, 0.175, 1] } }
};

const textVariants: Variants = {
  hidden: { y: 20, opacity: 0, filter: 'blur(10px)' },
  visible: { y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.23, 1, 0.32, 1] } }
};

import { Product } from '@/types/shop';
import SafeImage from '@/components/SafeImage';

import type { ProductReview } from '@/components/admin/types';

interface ShopProductClientProps {
  slug: string;
  productSchema?: string | null;
  dict: Dictionary;
  initialProduct?: Product;
  initialReviews?: ProductReview[];
}

export default function ShopProductClient({ slug, productSchema, dict, initialProduct, initialReviews = [] }: ShopProductClientProps) {
  const router = useRouter();
  const { addItem, removeItem, updateQuantity, clearCart, items, totalPrice } = useCart();
  const {
    product,
    reviews,
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    quantity,
    setQuantity,
    relatedProducts,
    hasSizes,
    availableSizes,
    effectiveSize,
    effectiveColor,
    handleAddToCart: hookHandleAddToCart,
  } = useProductSelection(initialProduct, initialReviews);

  const [isLoading, setIsLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'specs' | 'measurement' | null>('specs');
  const [measurementPopupItemKey, setMeasurementPopupItemKey] = useState<string | null>(null);
  const [isReviewsDrawerOpen, setIsReviewsDrawerOpen] = useState(false);
  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);

  const { isMobile, isIPhone } = useDevice();
  const [isWidescreen, setIsWidescreen] = useState(false);
  const photoRef = useRef<HTMLDivElement>(null);
  const [photoHeight, setPhotoHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsWidescreen(window.innerWidth >= 1536);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!photoRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setPhotoHeight(entry.contentRect.height);
      }
    });
    observer.observe(photoRef.current);
    return () => observer.disconnect();
  }, []);

  const [skipAnimation] = useState(() => {
    if (typeof window !== 'undefined') {
      const skip = sessionStorage.getItem('skip_product_animation') === 'true';
      if (skip) {
        sessionStorage.removeItem('skip_product_animation');
        return true;
      }
    }
    return false;
  });

  // Memoized Derived State
  const isPants = React.useMemo(() => product?.category?.toLowerCase() === 'celana', [product]);

  const isFnBCat = React.useMemo(() => {
    const cat = (product?.category || '').toLowerCase();
    return ['coffee', 'pastry', 'rtd', 'snack', 'beverage', 'pantry'].some(k => cat.includes(k));
  }, [product]);

  const isObjectsCat = React.useMemo(() => {
    const cat = (product?.category || '').toLowerCase();
    return !isFnBCat && ['home', 'kitchen', 'utilities', 'ceramics', 'objects', 'collectibles'].some(k => cat.includes(k));
  }, [product, isFnBCat]);

  const displaySpecs = React.useMemo(() => {
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    return safeSpecs.filter((s: any) => {
      if (!s?.label || typeof s.label !== 'string') return false;
      const lbl = s.label.trim();
      if (/^color(image|p1|p2|p3|p4|p5|desc|imagedesc|p1desc|p2desc|p3desc|p4desc|p5desc)\s*:/i.test(lbl)) return false;
      if (/^(extraimage|extraimagedesc|imagedesc|deskripsi_gambar)_/i.test(lbl)) return false;
      if (lbl.toLowerCase() === 'globalp5') return false;
      return true;
    });
  }, [product]);

  const displayMeasurements = React.useMemo(() => {
    const safeMeasurements = Array.isArray(product?.measurements) ? product.measurements : [];
    return safeMeasurements.length > 0 ? safeMeasurements : [];
  }, [product]);

  const displayModelInfo = React.useMemo(() => product?.model_info || null, [product]);

  const colorGalleryMap = React.useMemo(() => {
    const map: Record<string, { main?: string, p1?: string, p2?: string, p3?: string, p4?: string, p5?: string }> = {};
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    safeSpecs.forEach((spec: any) => {
      if (typeof spec?.label === 'string') {
        const match = spec.label.match(/^color\s*(image|p1|p2|p3|p4|p5)\s*:\s*(.+)$/i);
        if (match) {
          const type = match[1].toUpperCase();
          const colorName = match[2].trim().toUpperCase();
          if (!map[colorName]) map[colorName] = {};
          if (type === 'IMAGE') map[colorName].main = spec?.value;
          if (type === 'P1') map[colorName].p1 = spec?.value;
          if (type === 'P2') map[colorName].p2 = spec?.value;
          if (type === 'P3') map[colorName].p3 = spec?.value;
          if (type === 'P4') map[colorName].p4 = spec?.value;
          if (type === 'P5') map[colorName].p5 = spec?.value;
        }
      }
    });
    return map;
  }, [product]);

  const colorDescMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    safeSpecs.forEach((spec: any) => {
      if (typeof spec?.label === 'string') {
        const match = spec.label.match(/^colordesc\s*:\s*(.+)$/i);
        if (match && spec.value) {
          map[match[1].trim().toUpperCase()] = spec.value;
        }
      }
    });
    return map;
  }, [product]);

  const colorImageDescMap = React.useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    safeSpecs.forEach((spec: any) => {
      if (typeof spec?.label === 'string') {
        const match = spec.label.match(/^color(image|p1|p2|p3|p4|p5)desc\s*:\s*(.+)$/i);
        if (match && spec.value) {
          const type = match[1].toUpperCase();
          const colorName = match[2].trim().toUpperCase();
          if (!map[colorName]) map[colorName] = {};
          if (type === 'IMAGE') map[colorName].main = spec.value;
          if (type === 'P1') map[colorName].p1 = spec.value;
          if (type === 'P2') map[colorName].p2 = spec.value;
          if (type === 'P3') map[colorName].p3 = spec.value;
          if (type === 'P4') map[colorName].p4 = spec.value;
          if (type === 'P5') map[colorName].p5 = spec.value;
        }
      }
    });
    return map;
  }, [product]);

  const images = React.useMemo(() => {
    if (!product) return [''];
    const safeColor = effectiveColor?.trim()?.toUpperCase();
    const activeGallery = safeColor ? colorGalleryMap[safeColor] : undefined;
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    const globalP5 = safeSpecs.find((s: any) => s?.label === 'GlobalP5')?.value;
    
    const extraImages = safeSpecs
      .filter((s: any) => typeof s?.label === 'string' && s.label.startsWith('ExtraImage_') && s.value?.trim())
      .sort((a: any, b: any) => {
        const numA = parseInt(a.label.replace('ExtraImage_', ''), 10) || 0;
        const numB = parseInt(b.label.replace('ExtraImage_', ''), 10) || 0;
        return numA - numB;
      })
      .map((s: any) => s.value.trim());

    let rawImages: string[] = [];
    if (effectiveColor && activeGallery && (activeGallery.main || activeGallery.p1 || activeGallery.p2 || activeGallery.p3 || activeGallery.p4 || activeGallery.p5)) {
      rawImages = [
        activeGallery.main || '', activeGallery.p1, activeGallery.p2, activeGallery.p3, activeGallery.p4, activeGallery.p5, ...extraImages
      ].filter((img): img is string => typeof img === 'string' && img.length > 0);
    } else {
      rawImages = [
        product.image_url, product.perspective1, product.perspective2, product.perspective3, product.perspective4, globalP5, ...extraImages
      ].filter((img): img is string => typeof img === 'string' && img.length > 0);
    }
    return rawImages.length > 0 ? rawImages : [''];
  }, [product, effectiveColor, colorGalleryMap]);

  const localizedDescription = React.useMemo(() => {
    return dict.locale === 'EN' && product?.description_en ? product.description_en : product?.description;
  }, [dict.locale, product]);

  const imageDescriptionItems = React.useMemo(() => {
    if (!product) return [];
    const safeSpecs = Array.isArray(product?.specifications) ? product.specifications : [];
    const safeColor = effectiveColor?.trim()?.toUpperCase();
    const activeGallery = safeColor ? colorGalleryMap[safeColor] : undefined;
    const activeDescGallery = safeColor ? colorImageDescMap[safeColor] : undefined;
    const variantFallbackDesc = safeColor ? colorDescMap[safeColor] : undefined;

    const getDesc = (keys: string[]) => {
      for (const key of keys) {
        const found = safeSpecs.find((s: any) => s?.label && s.label.toLowerCase() === key.toLowerCase());
        if (found && found.value?.trim()) return found.value.trim();
      }
      return undefined;
    };

    const baseSlots = [
      {
        url: activeGallery?.main || product.image_url,
        desc: activeDescGallery?.main || variantFallbackDesc || getDesc(['imagedesc_main', 'imagedesc_0', 'deskripsi_gambar_0'])
      },
      {
        url: activeGallery?.p1 || product.perspective1,
        desc: activeDescGallery?.p1 || variantFallbackDesc || getDesc(['imagedesc_p1', 'imagedesc_1', 'deskripsi_gambar_1'])
      },
      {
        url: activeGallery?.p2 || product.perspective2,
        desc: activeDescGallery?.p2 || variantFallbackDesc || getDesc(['imagedesc_p2', 'imagedesc_2', 'deskripsi_gambar_2'])
      },
      {
        url: activeGallery?.p3 || product.perspective3,
        desc: activeDescGallery?.p3 || variantFallbackDesc || getDesc(['imagedesc_p3', 'imagedesc_3', 'deskripsi_gambar_3'])
      },
      {
        url: activeGallery?.p4 || product.perspective4,
        desc: activeDescGallery?.p4 || variantFallbackDesc || getDesc(['imagedesc_p4', 'imagedesc_4', 'deskripsi_gambar_4'])
      },
      {
        url: activeGallery?.p5 || safeSpecs.find((s: any) => s?.label === 'GlobalP5')?.value,
        desc: activeDescGallery?.p5 || variantFallbackDesc || getDesc(['imagedesc_p5', 'imagedesc_5', 'deskripsi_gambar_5'])
      }
    ];

    const extraSlots = safeSpecs
      .filter((s: any) => typeof s?.label === 'string' && s.label.startsWith('ExtraImage_') && s.value?.trim())
      .sort((a: any, b: any) => {
        const numA = parseInt(a.label.replace('ExtraImage_', ''), 10) || 0;
        const numB = parseInt(b.label.replace('ExtraImage_', ''), 10) || 0;
        return numA - numB;
      })
      .map((s: any, idx: number) => {
        const idxNum = s.label.replace('ExtraImage_', '');
        const desc = getDesc([
          `extraimagedesc_${idxNum}`,
          `imagedesc_${6 + idx}`,
          `deskripsi_gambar_${6 + idx}`
        ]);
        return { url: s.value.trim(), desc };
      });

    return [...baseSlots, ...extraSlots];
  }, [product, effectiveColor, colorGalleryMap, colorImageDescMap, colorDescMap]);

  const currentImageDesc = React.useMemo(() => {
    if (!product || !images || images.length === 0) return null;
    const currentUrl = images[activeImageIndex];
    if (!currentUrl) return null;

    // 1. Match by URL first
    const matchByUrl = imageDescriptionItems.find(item => item.url && item.url === currentUrl && item.desc);
    if (matchByUrl?.desc) return matchByUrl.desc;

    // 2. Fallback match by index
    const matchByIndex = imageDescriptionItems[activeImageIndex]?.desc;
    if (matchByIndex) return matchByIndex;

    return null;
  }, [product, images, activeImageIndex, imageDescriptionItems]);

  const availableColors = React.useMemo(() => {
    const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
    return Array.from<string>(new Set(
      safeVariants.filter((v: any) => (!hasSizes || v?.size?.toUpperCase() === effectiveSize?.toUpperCase()) && v?.color).map((v: any) => v.color as string)
    ));
  }, [product, hasSizes, effectiveSize]);

  const selectedVariant = React.useMemo(() => {
    const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
    return safeVariants.find((v: any) => 
      (!hasSizes ? !v?.size : v?.size?.toUpperCase() === effectiveSize?.toUpperCase()) && 
      (!effectiveColor ? !v?.color : v?.color?.toUpperCase() === effectiveColor?.toUpperCase())
    );
  }, [product, hasSizes, effectiveSize, effectiveColor]);

  if (isLoading) return <div className="min-h-screen bg-cr flex items-center justify-center font-medium uppercase tracking-[0.5em] text-ink/10 animate-pulse">Initializing Shop Catalog...</div>;
  if (!product) return <div className="min-h-screen bg-cr flex items-center justify-center">Product Not Found.</div>;
  
  const availableStock = selectedVariant && typeof selectedVariant.stock_quantity === 'number' ? selectedVariant.stock_quantity : 0;
  const displayQuantity = availableStock === 0 ? 0 : Math.min(quantity, availableStock);

  const isSurchargeSize = (size: string) => SURCHARGE_SIZES.some(s => s?.toUpperCase() === size?.toUpperCase());
  const currentSurcharge = isSurchargeSize(effectiveSize) ? SIZE_SURCHARGE_AMOUNT : 0;

  const handleAddToCart = () => {
    if (!product) return;
    if (availableStock === 0) return;
    const success = hookHandleAddToCart();
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  return (
    <main className={cn("min-h-screen bg-cr noise", isIPhone && "ios-mobile-layout")}>
      <div className={cn(
        "pt-0 md:pt-16 lg:pt-20 px-4 md:px-10 relative",
        isMobile && "pb-24"
      )}>

        <motion.div 
          variants={staggerContainer}
          initial={skipAnimation ? false : "hidden"}
          animate="visible"
          className="flex flex-col lg:grid lg:grid-cols-[85px_minmax(0,1.4fr)_minmax(0,2.6fr)] xl:grid-cols-[85px_minmax(0,1.3fr)_minmax(0,2.7fr)] 2xl:grid-cols-[85px_minmax(0,1.2fr)_minmax(0,2.4fr)_minmax(0,0.9fr)] lg:items-start lg:align-items-start gap-1.5 lg:gap-6 xl:gap-8 mt-0 lg:mt-2"
        >

          <ProductGallery
            product={product}
            images={images}
            reviews={reviews}
            setIsReviewsDrawerOpen={setIsReviewsDrawerOpen}
            activeImageIndex={activeImageIndex}
            setActiveImageIndex={setActiveImageIndex}
            setFullscreenImage={setFullscreenImage}
            columnVariants={columnVariants}
            imageVariants={imageVariants}
            textVariants={textVariants}
            photoRef={photoRef}
            onExpand={() => setIsImmersiveOpen(true)}
          />

          {/* Combined Product Info & Options Column */}
          <div className="col-span-1 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4 lg:gap-6 xl:gap-10 w-full relative">
            {/* Column 3: Product Info */}
            <motion.div 
              variants={columnVariants} 
              className="flex flex-col pt-2 pb-0 lg:py-1 lg:pl-0"
              style={!isMobile && photoHeight > 0 ? { height: `${photoHeight}px` } : undefined}
            >
            <div className="space-y-0.5 lg:space-y-1 h-full flex flex-col">
              <div className="shrink-0 space-y-0.5 lg:space-y-1">
                <motion.div variants={textVariants} className="flex items-center gap-2 mb-0.5 lg:mb-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-ink text-white rounded-none w-fit shadow-md">
                    <span className="text-[8px] md:text-[9px] lg:text-[9px] font-medium uppercase tracking-[0.3em]">
                      {product.badge_text || 'STUDIO EDITION'}
                    </span>
                  </div>
                </motion.div>
                <motion.h1 variants={textVariants} className="text-base md:text-base lg:text-lg font-display font-medium italic tracking-tighter text-ink leading-normal uppercase mb-1">{product.name}</motion.h1>

                <motion.div variants={textVariants} className="flex flex-wrap items-center gap-3 mt-0.5">
                  <p className="text-base md:text-sm lg:text-base font-display font-semibold italic text-emerald-700">
                    IDR {product.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  
                  {product.price_tag && (
                    <div className="flex items-center gap-1.5 border border-rose/20 px-2.5 py-0.5 bg-rose/[0.02] ml-auto">
                      <span className="text-[10px] md:text-[8px] font-medium text-rose uppercase tracking-[0.2em] flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                          <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                        {product.price_tag}
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

              <div className="space-y-1.5 pt-1.5 lg:pt-2 border-t border-ink/5 mt-1.5 lg:mt-2">
                <div className="flex items-center justify-between">
                  <motion.h4 variants={textVariants} className="text-sm md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/60">
                    {dict.product.description}
                  </motion.h4>
                  {currentImageDesc && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded text-[9px] font-bold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      View #{activeImageIndex + 1} Angle Detail
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`img-desc-${activeImageIndex}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="space-y-2.5"
                  >
                    {currentImageDesc ? (
                      <div className="p-3.5 bg-ink/[0.02] border-l-2 border-emerald-600 rounded-r-lg">
                        <p className="text-sm md:text-xs lg:text-sm leading-relaxed text-ink font-medium whitespace-pre-wrap">
                          {currentImageDesc}
                        </p>
                      </div>
                    ) : (
                      <p className="text-base md:text-sm lg:text-sm leading-relaxed text-ink/90 font-medium whitespace-pre-wrap">
                        {localizedDescription || 'Premium quality product from NINOC.'}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="pt-1 border-t border-ink/5 mt-1 lg:mt-1.5 sticky top-0 bg-white z-10">
                <motion.div variants={textVariants} className="flex items-center gap-3 mb-1.5">
                  <button
                    onClick={() => setActiveInfoTab(activeInfoTab === 'specs' ? null : 'specs')}
                    className={`text-sm md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] transition-colors ${
                      activeInfoTab === 'specs' ? 'text-ink' : 'text-ink/50 hover:text-ink/50'
                    }`}
                  >
                    {dict.product.specs}
                  </button>
                  <span className="text-ink/10">|</span>
                  <button
                    onClick={() => setActiveInfoTab(activeInfoTab === 'measurement' ? null : 'measurement')}
                    className={`text-sm md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] transition-colors flex items-center gap-1 ${
                      activeInfoTab === 'measurement' ? 'text-ink' : 'text-ink/50 hover:text-ink/50'
                    }`}
                  >
                    <Ruler size={9} className="text-rose" />
                    {dict.product.measurement}
                  </button>
                </motion.div>

                <div className="mt-1">
                  {activeInfoTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                      {displaySpecs.map((spec: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center border-b border-ink/10 py-1.5">
                          <span className="text-[12px] md:text-[11px]" style={{ color: '#0A0A0A', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{spec.label}</span>
                          <span className="text-[12px] md:text-[11px]" style={{ color: '#0A0A0A', opacity: 1, fontWeight: 400, textAlign: 'right' }}>{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeInfoTab === 'measurement' && (
                    <div className="space-y-1 w-full overflow-x-auto no-scrollbar pb-1">
                      <div className="grid grid-cols-[30px_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-[11px] md:text-xs font-semibold border-b border-ink/20 pb-1.5 mb-1.5 min-w-[200px]">
                        <span className="text-ink/80">SIZE</span>
                        <span className="text-ink/80 text-center">{isPants ? 'WAIST/LENGTH' : 'CHEST/LENGTH'}</span>
                        <span className="text-ink/80 text-right">WEIGHT/HEIGHT</span>
                      </div>
                      {displayMeasurements.map((m: any, idx: number) => {
                        const wh = getWeightAndHeight(m.size);
                        const isSelected = effectiveSize && m.size.toUpperCase() === effectiveSize.toUpperCase();
                        return (
                          <div key={idx} className={cn(
                            "grid grid-cols-[30px_minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center py-2 border-b last:border-0 transition-colors min-w-[200px]",
                            isSelected ? "border-ink/20 bg-ink/5" : "border-ink/10 hover:border-ink/20 hover:bg-ink/[0.02]"
                          )}>
                            <span className={cn("text-sm md:text-xs font-bold", isSelected ? "text-ink" : "text-ink/90")}>{m.size}</span>
                            <span className={cn("text-xs md:text-[11px] font-mono tracking-wider text-center", isSelected ? "text-ink font-semibold" : "text-ink font-medium")}>{isPants ? `${m.waist || '-'} / ${m.length}` : `${m.chest || '-'} / ${m.length}`}</span>
                            <span className={cn("text-xs md:text-[11px] font-mono tracking-wider text-right", isSelected ? "text-ink font-semibold" : "text-ink font-medium")}>{wh.w} / {wh.h}</span>
                          </div>
                        );
                      })}
                      {displayModelInfo && (
                        <p className="text-[11px] md:text-[8px] text-ink/60 mt-0.5 uppercase font-medium italic">* {displayModelInfo}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Column 4: Options / Purchase Details */}
          <motion.div variants={columnVariants} className="flex flex-col py-0 lg:py-1 lg:pl-0">
            <div className="space-y-2 lg:space-y-6 flex flex-col h-full">
              {hasSizes && (
                <div className="space-y-1.5 lg:space-y-3 mt-1 lg:mt-0 border-t border-ink/5 lg:border-none pt-2 lg:pt-0">
                  <motion.h4 variants={textVariants} className="text-xs md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/60 border-b border-ink/5 pb-1 lg:pb-2">{dict.product.selectSize}</motion.h4>
                  <div className="flex gap-1.5 lg:gap-3 flex-wrap pr-2">
                    {availableSizes.map((size) => (
                      <motion.button
                        variants={textVariants}
                        key={size}
                        onClick={() => { setSelectedSize(size); setQuantity(1); }}
                        className={cn(
                          "active:scale-[0.97] h-9 lg:h-10 min-w-[2.5rem] lg:min-w-[3rem] px-2 rounded-none flex items-center justify-center text-xs lg:text-xs font-medium transition-all border relative",
                          effectiveSize === size ? "bg-ink text-white border-ink shadow-md" : "bg-white text-ink border-ink/5 hover:border-ink/20"
                        )}
                      >
                        {size}
                        {isSurchargeSize(size) && (
                          <span className={cn(
                            "absolute -top-1.5 -right-2 text-[7px] font-bold px-1.5 py-0.5 leading-none rounded-sm shadow-sm border",
                            effectiveSize === size ? "bg-white text-rose border-rose" : "bg-rose text-white border-rose/20"
                          )}>
                            +25K
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  {currentSurcharge > 0 && (
                    <motion.div variants={textVariants} className="flex items-center gap-1.5 mt-2 px-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose animate-pulse" />
                      <span className="text-[11px] md:text-[9px] font-semibold text-rose uppercase tracking-wider">
                        +IDR {SIZE_SURCHARGE_AMOUNT.toLocaleString('id-ID')} biaya tambahan ukuran {effectiveSize}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="space-y-2 border-t border-ink/5 lg:border-none pt-2 lg:pt-0">
                  <motion.h4 variants={textVariants} className="text-xs md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/60 border-b border-ink/5 pb-1 lg:pb-2">
                    {product?.variant_label
                      ? `Pilih ${product.variant_label}`
                      : isObjectsCat
                        ? 'Pilih Varian / Series'
                        : isFnBCat
                          ? 'Pilih Varian / Blend'
                          : dict.product.selectColor}
                  </motion.h4>
                  <div className="flex gap-2 flex-wrap">
                    {availableColors.map((color) => {
                      const colorGallery = colorGalleryMap[color];
                      const colorImg = colorGallery?.main;
                      return (
                      <motion.button
                        variants={textVariants}
                        key={color}
                        onClick={() => { setSelectedColor(color); setQuantity(1); setActiveImageIndex(0); }}
                        className={cn(
                          "active:scale-[0.97] flex items-center gap-2 px-3 py-1.5 rounded-none text-xs md:text-[10px] lg:text-[11px] font-medium uppercase tracking-wider border transition-all",
                          effectiveColor === color
                            ? "bg-ink text-white border-ink"
                            : "bg-white text-ink/60 border-ink/10 hover:border-ink/30"
                        )}
                      >
                        {colorImg && (
                          <div className="w-4 h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full overflow-hidden shrink-0 border border-current">
                            <Image src={colorImg} alt={color} width={16} height={16} className="w-full h-full object-cover" unoptimized />
                          </div>
                        )}
                        <span>{color}</span>
                      </motion.button>
                      );
                    })}
                  </div>
                  {effectiveColor && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 p-3 rounded bg-ink/[0.02] border border-ink/10 text-xs text-ink/80 leading-relaxed space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {product?.variant_label || (isObjectsCat ? 'Selected Series/Model' : isFnBCat ? 'Selected Blend/Flavor' : 'Selected Variant')}:
                        </span>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink bg-white px-2 py-0.5 border border-ink/10 shadow-2xs">
                          {effectiveColor}
                        </span>
                      </div>
                      {colorDescMap[effectiveColor.toUpperCase()] && (
                        <p className="text-ink/80 text-xs leading-relaxed pt-1 border-t border-ink/5">
                          {colorDescMap[effectiveColor.toUpperCase()]}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              <div className="space-y-1.5 lg:space-y-2 mt-2 lg:mt-0">
                <motion.div variants={textVariants} className="flex items-center gap-2 border-b border-ink/5 pb-1 lg:pb-2">
                  <h4 className="text-xs md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/60">{dict.product.quantity}</h4>
                  {availableStock > 0 ? (
                    <span className="text-xs md:text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 uppercase tracking-wider">
                      {availableStock} {dict.product.inStock}
                    </span>
                  ) : (
                    <span className="text-xs md:text-[10px] font-medium text-rose bg-rose/5 px-1.5 py-0.5 uppercase tracking-wider">
                      {dict.product.outOfStock}
                    </span>
                  )}
                </motion.div>
                <motion.div variants={textVariants} className="flex items-center gap-2 w-fit border border-ink/10 px-3 py-2 rounded-none bg-white">
                  <button onClick={() => setQuantity(Math.max(1, displayQuantity - 1))} disabled={availableStock === 0 || displayQuantity <= 1} className="w-6 h-6 flex items-center justify-center transition-all text-ink/60 hover:text-rose disabled:opacity-30"><Minus size={14} strokeWidth={2} /></button>
                  <span className="text-sm md:text-sm lg:text-sm font-medium w-10 text-center text-ink">{displayQuantity}</span>
                  <button onClick={() => setQuantity(displayQuantity + 1)} disabled={availableStock === 0 || displayQuantity >= availableStock} className="w-6 h-6 flex items-center justify-center transition-all text-ink/60 hover:text-rose disabled:opacity-30"><Plus size={14} strokeWidth={2} /></button>
                </motion.div>
              </div>

              {availableStock > 0 && (
                <div className="mt-4 w-full">
                  <motion.button
                    variants={textVariants}
                    onClick={() => {
                      handleAddToCart();
                      if (!isMobile && window.innerWidth < 1536) {
                        router.push('/checkout');
                      }
                    }}
                    disabled={addedToCart}
                    className={cn(
                      "active:scale-[0.97] w-full py-2.5 lg:py-2.5 rounded-none font-medium text-xs md:text-sm lg:text-[11px] uppercase tracking-[0.15em] lg:tracking-[0.2em] flex items-center justify-center gap-2 lg:gap-4 transition-all relative overflow-hidden group shadow-xl shadow-ink/5",
                      addedToCart ? "bg-emerald-500 text-white" : "bg-ink text-white hover:bg-rose"
                    )}
                  >
                      {addedToCart ? (
                        <span className="flex items-center gap-2">
                          <ShieldCheck size={16} /> {dict.product.added}
                        </span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center">
                            <ShoppingBag size={16} />
                            {items.length > 0 && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2.5 w-3.5 h-3.5 bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center rounded-none"
                              >
                                {items.reduce((sum, item) => sum + item.quantity, 0)}
                              </motion.div>
                            )}
                          </div>
                          <span>
                            Add to Cart
                          </span>
                        </div>
                      )}
                  </motion.button>
                </div>
              )}

              {!isMobile && (
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-ink/5 mt-6">
                  {[
                    { icon: ShieldCheck, label: dict.product.securePayment },
                    { icon: Truck, label: dict.product.expressShipping },
                    { icon: RefreshCw, label: dict.product.easyReturns }
                  ].map((badge, i) => (
                    <motion.div variants={textVariants} key={i} className="flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity text-center">
                      <badge.icon size={14} className="text-rose" />
                      <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-widest leading-tight">{badge.label}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
          </div>

          <CartSidebar
            dict={dict}
            isMobile={isMobile}
            displayMeasurements={displayMeasurements}
            isPants={isPants}
            getWeightAndHeight={getWeightAndHeight}
            textVariants={textVariants}
            columnVariants={columnVariants}
          />
        </motion.div>

        <RelatedProductsList
          relatedProducts={relatedProducts}
          dict={dict}
          staggerContainer={staggerContainer}
          textVariants={textVariants}
        />
      </div>

      <ImageLightbox
        isOpen={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
        altText={product?.name || "Product Image"}
      />

      <ProductReviewsDrawer
        isOpen={isReviewsDrawerOpen}
        onClose={() => setIsReviewsDrawerOpen(false)}
        reviews={reviews}
        productName={product.name}
        productId={product.id}
      />

      <ImmersiveProductView
        isOpen={isImmersiveOpen}
        onClose={() => setIsImmersiveOpen(false)}
        product={product}
        images={images}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        quantity={quantity}
        setQuantity={setQuantity}
        hasSizes={hasSizes}
        availableSizes={availableSizes}
        availableColors={availableColors}
        handleAddToCart={handleAddToCart}
        localizedDescription={currentImageDesc || localizedDescription}
        displaySpecs={displaySpecs}
      />
    </main>
  );
}