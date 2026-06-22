"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, ChevronLeft, Ruler, Plus, Minus, Trash2, X, ImageOff } from 'lucide-react';
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
      className={cn("object-contain", className)}
      sizes={sizes || "(max-width: 768px) 50vw, 30vw"}
      priority={priority}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  description_en?: string;
  price: number;
  image_url: string;
  image_alt?: string | null;
  category: string;
  perspective1?: string;
  perspective2?: string;
  perspective3?: string;
  perspective4?: string;
  price_tag?: string | null;
  badge_text?: string | null;
  variants?: { id: string; size: string | null; color: string | null; stock_quantity: number }[];
  specifications?: { label: string; value: string }[] | null;
  measurements?: { size: string; chest?: string; waist?: string; length: string; leg_opening?: string }[] | null;
  model_info?: string | null;
}

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
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [reviews] = useState<ProductReview[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'specs' | 'measurement'>('specs');
  const [measurementPopupItemKey, setMeasurementPopupItemKey] = useState<string | null>(null);

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

  // Default fallbacks if admin does not provide data
  const DEFAULT_SPECS = [
    { label: 'Jenis Atasan', value: 'Kaos' },
    { label: 'Bahan', value: 'Katun' },
    { label: 'Gaya', value: 'Basic' },
    { label: 'Motif', value: 'Lainnya' },
    { label: 'Panjang Lengan', value: 'Lengan Pendek' },
    { label: 'Garis Leher', value: 'Kerah Bulat' },
  ];
  type MeasurementItem = { size: string; chest?: string; waist?: string; length: string; leg_opening?: string };

  const DEFAULT_MEASUREMENTS_STANDARD: MeasurementItem[] = [
    { size: 'S', chest: '96', length: '68' },
    { size: 'M', chest: '100', length: '70' },
    { size: 'L', chest: '104', length: '72' },
    { size: 'XL', chest: '108', length: '74' },
    { size: 'XXL', chest: '112', length: '76' },
    { size: '3XL', chest: '116', length: '78' },
    { size: '4XL', chest: '120', length: '80' },
  ];

  const DEFAULT_MEASUREMENTS_OVERSIZE: MeasurementItem[] = [
    { size: 'S', chest: '106', length: '70' },
    { size: 'M', chest: '112', length: '72' },
    { size: 'L', chest: '118', length: '74' },
    { size: 'XL', chest: '124', length: '76' },
    { size: 'XXL', chest: '130', length: '78' },
    { size: '3XL', chest: '136', length: '80' },
    { size: '4XL', chest: '142', length: '82' },
  ];

  const DEFAULT_MEASUREMENTS_CELANA: MeasurementItem[] = [
    { size: '28', waist: '76', length: '100', leg_opening: '38' },
    { size: '30', waist: '81', length: '100', leg_opening: '40' },
    { size: '32', waist: '86', length: '102', leg_opening: '42' },
    { size: '34', waist: '91', length: '102', leg_opening: '44' },
    { size: '36', waist: '96', length: '104', leg_opening: '46' },
    { size: '38', waist: '101', length: '104', leg_opening: '48' },
  ];

  const fitTypeSpec = product?.specifications?.find(s => s.label.toLowerCase().includes('fit') || s.label.toLowerCase().includes('potongan'));
  const isOversize = fitTypeSpec?.value.toLowerCase().includes('oversize');
  const isPants = product?.category?.toLowerCase() === 'celana';

  const DEFAULT_MODEL_INFO_STANDARD = "Model wearing Size M (175cm / 65kg)";
  const DEFAULT_MODEL_INFO_OVERSIZE = "Model wearing Size M Oversize (175cm / 65kg)";
  const DEFAULT_MODEL_INFO_CELANA = "Model wearing Size 30 (175cm / 65kg)";

  const displaySpecs = (product?.specifications && product.specifications.length > 0 ? product.specifications : DEFAULT_SPECS).filter(s => !/^Color(Image|P1|P2|P3|P4|P5):/.test(s.label) && s.label !== 'GlobalP5');
  const fallbackMeasurements = isPants ? DEFAULT_MEASUREMENTS_CELANA : (isOversize ? DEFAULT_MEASUREMENTS_OVERSIZE : DEFAULT_MEASUREMENTS_STANDARD);
  let displayMeasurements = product?.measurements && product.measurements.length > 0 ? product.measurements : fallbackMeasurements;
  const fallbackModelInfo = isPants ? DEFAULT_MODEL_INFO_CELANA : (isOversize ? DEFAULT_MODEL_INFO_OVERSIZE : DEFAULT_MODEL_INFO_STANDARD);
  const displayModelInfo = product?.model_info || fallbackModelInfo;

  const getWeightAndHeight = (size: string) => {
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
  };

  useEffect(() => {
    if (!product) return;
    
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const fetchRelated = async () => {
      try {
        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category', product.category)
          .neq('id', product.id)
          .limit(4);
        setRelatedProducts(related || []);
      } catch (e) {
        console.error('Failed to fetch related', e);
      }
    };
    
    fetchRelated();
    
    try {
      channel = supabase
        .channel(`variants-stock-${product.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'variants',
          filter: `product_id=eq.${product.id}`
        }, async () => {
          // Refetch variants if stock changes
          const { data } = await supabase
            .from('products')
            .select('*, variants(*)')
            .eq('id', product.id)
            .single();
          if (data) setProduct(data);
        })
        .subscribe();
    } catch {
      console.warn('Realtime subscription unavailable');
    }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* ignore */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, product?.category]);

  const hasSizes = product?.variants?.some(v => v.size && v.size.trim() !== '');

  const availableSizes = (() => {
    if (!product?.variants?.length || !hasSizes) return [];
    const sizes = Array.from(new Set(product.variants.map(v => v.size).filter(Boolean))) as string[];
    
    const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
    sizes.sort((a, b) => {
      const idxA = SIZE_ORDER.indexOf(a.toUpperCase());
      const idxB = SIZE_ORDER.indexOf(b.toUpperCase());
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sizes;
  })();

  if (hasSizes && availableSizes.length > 0) {
    displayMeasurements = displayMeasurements.filter(m => availableSizes.some(s => s.toUpperCase() === m.size.toUpperCase()));
  }

  const effectiveSize = (() => {
    if (!hasSizes) return '';
    const match = availableSizes.find(s => s.toUpperCase() === selectedSize.toUpperCase());
    if (match) return match;
    return availableSizes[0] || '';
  })();

  const effectiveColor = (() => {
    if (!product?.variants?.length) return selectedColor;
    const colorsForSize = Array.from(new Set(
      product.variants.filter(v => (!hasSizes || v.size?.toUpperCase() === effectiveSize.toUpperCase()) && v.color).map(v => v.color as string)
    ));
    const match = colorsForSize.find(c => c.toUpperCase() === selectedColor.toUpperCase());
    if (match) return match;
    return colorsForSize[0] || '';
  })();

  if (isLoading) return <div className="min-h-screen bg-cr flex items-center justify-center font-medium uppercase tracking-[0.5em] text-ink/10 animate-pulse">Initializing Shop Catalog...</div>;
  if (!product) return <div className="min-h-screen bg-cr flex items-center justify-center">Product Not Found.</div>;

  const colorGalleryMap: Record<string, { main?: string, p1?: string, p2?: string, p3?: string, p4?: string, p5?: string }> = {};
  if (product?.specifications) {
    product.specifications.forEach(spec => {
      const match = spec.label.match(/^Color(Image|P1|P2|P3|P4|P5):(.+)$/);
      if (match) {
        const type = match[1];
        const colorName = match[2];
        if (!colorGalleryMap[colorName]) colorGalleryMap[colorName] = {};
        if (type === 'Image') colorGalleryMap[colorName].main = spec.value;
        if (type === 'P1') colorGalleryMap[colorName].p1 = spec.value;
        if (type === 'P2') colorGalleryMap[colorName].p2 = spec.value;
        if (type === 'P3') colorGalleryMap[colorName].p3 = spec.value;
        if (type === 'P4') colorGalleryMap[colorName].p4 = spec.value;
        if (type === 'P5') colorGalleryMap[colorName].p5 = spec.value;
      }
    });
  }

  const activeGallery = effectiveColor ? colorGalleryMap[effectiveColor] : undefined;
  const globalP5 = product?.specifications?.find(s => s.label === 'GlobalP5')?.value;

  let rawImages: string[] = [];

  if (effectiveColor) {
    if (activeGallery && (activeGallery.main || activeGallery.p1 || activeGallery.p2 || activeGallery.p3 || activeGallery.p4 || activeGallery.p5)) {
      rawImages = [
        activeGallery.main || '',
        activeGallery.p1,
        activeGallery.p2,
        activeGallery.p3,
        activeGallery.p4,
        activeGallery.p5
      ].filter((img): img is string => typeof img === 'string' && img.length > 0);
    } else {
      rawImages = []; // No fallback if specific color has no images
    }
  } else {
    rawImages = [
      product.image_url,
      product.perspective1,
      product.perspective2,
      product.perspective3,
      product.perspective4,
      globalP5
    ].filter((img): img is string => typeof img === 'string' && img.length > 0);
  }

  const images = rawImages.length > 0 ? rawImages : [''];

  const localizedDescription = dict.locale === 'EN' && product.description_en ? product.description_en : product.description;

  const availableColors = Array.from(new Set(
    product?.variants?.filter(v => (!hasSizes || v.size?.toUpperCase() === effectiveSize.toUpperCase()) && v.color).map(v => v.color as string) || []
  ));

  const selectedVariant = product?.variants?.find(v => 
    (!hasSizes ? !v.size : v.size?.toUpperCase() === effectiveSize.toUpperCase()) && 
    (!effectiveColor ? !v.color : v.color?.toUpperCase() === effectiveColor.toUpperCase())
  );
  
  const availableStock = selectedVariant ? selectedVariant.stock_quantity : 0;
  const displayQuantity = availableStock === 0 ? 0 : Math.min(quantity, availableStock);

  const isSurchargeSize = (size: string) => SURCHARGE_SIZES.some(s => s.toUpperCase() === size.toUpperCase());
  const currentSurcharge = isSurchargeSize(effectiveSize) ? SIZE_SURCHARGE_AMOUNT : 0;

  const handleAddToCart = () => {
    if (product) {
      if (availableStock === 0) return;
      const surcharge = isSurchargeSize(effectiveSize) ? SIZE_SURCHARGE_AMOUNT : 0;
      const effectiveMainImage = effectiveColor ? (colorGalleryMap[effectiveColor]?.main || null) : product.image_url;
      const productToAdd = { ...product, image_url: effectiveMainImage };
      for (let i = 0; i < displayQuantity; i++) {
        addItem(productToAdd, effectiveSize, effectiveColor, surcharge);
      }
      setAddedToCart(true);
      
      if (!isWidescreen) {
        router.push('/checkout');
      } else {
        setTimeout(() => setAddedToCart(false), 2000);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const distance = touchStart - e.changedTouches[0].clientX;
    if (distance > 40) setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    if (distance < -40) setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    setTouchStart(null);
  };

  return (
    <main className={cn("min-h-screen bg-cr noise", isIPhone && "ios-mobile-layout")}>
      <div className={cn(
        "pt-0 md:pt-16 lg:pt-20 px-4 md:px-10 relative",
        isMobile && "pb-24"
      )}>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:grid lg:grid-cols-[85px_minmax(0,1.6fr)_minmax(0,2.4fr)] xl:grid-cols-[85px_minmax(0,1.6fr)_minmax(0,2.4fr)] 2xl:grid-cols-[85px_minmax(0,1.6fr)_minmax(0,2fr)_minmax(0,0.9fr)] lg:items-start lg:align-items-start gap-1.5 lg:gap-4 xl:gap-5 2xl:gap-6 mt-0 lg:mt-2"
        >

          <motion.div variants={columnVariants} className="hidden lg:block w-full shrink-0">
            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pt-2 pb-2 pr-1 max-h-[600px]">
              {images.map((img, i) => (
                <motion.button
                  variants={textVariants}
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "w-full aspect-square rounded-none overflow-hidden border-2 transition-all relative group bg-white flex-shrink-0",
                    activeImageIndex === i ? "border-rose opacity-100 shadow-sm" : "border-ink/5 opacity-50 hover:opacity-100 hover:border-ink/15"
                  )}
                >
                  <SafeImage src={img} alt={product.image_alt || product.name} className="object-contain p-1.5" sizes="100px" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={columnVariants} className="col-span-1 relative flex items-center lg:px-6 xl:px-8 w-full lg:self-start">

            <div
              className="flex lg:hidden relative w-full justify-center items-center overflow-hidden py-0 touch-pan-y mt-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-[75%] aspect-[4/5] invisible pointer-events-none" />

              {images.map((img, idx) => {
                const isActive = idx === activeImageIndex;
                const isPrev = idx === (activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1);
                const isNext = idx === (activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1);

                let positionClass = "opacity-0 scale-75 translate-x-0 z-0 pointer-events-none";
                if (isActive) positionClass = "opacity-100 scale-100 translate-x-0 z-20 shadow-xl";
                else if (isPrev) positionClass = "opacity-40 scale-[0.85] -translate-x-[65%] z-10 shadow-sm cursor-pointer";
                else if (isNext) positionClass = "opacity-40 scale-[0.85] translate-x-[65%] z-10 shadow-sm cursor-pointer";

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isPrev) setActiveImageIndex(idx);
                      else if (isNext) setActiveImageIndex(idx);
                      else if (isActive) setFullscreenImage(img);
                    }}
                    className={cn(
                      "absolute w-[75%] aspect-[4/5] rounded-none bg-white border border-ink/5 flex items-center justify-center transition-all duration-500 ease-out",
                      positionClass
                    )}
                  >
                    <SafeImage src={img} alt={`${product.image_alt || product.name} ${idx}`} className="object-contain p-4" sizes="(max-width: 768px) 65vw, 30vw" />
                  </div>
                );
              })}
            </div>

            <motion.div ref={photoRef} variants={imageVariants} className="hidden lg:flex w-full relative aspect-[4/5] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl items-center justify-center">
              <motion.div 
                initial={{ scale: 1.1, filter: 'blur(10px)' }}
                animate={{ scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 3, ease: [0.23, 1, 0.32, 1], delay: 0.5 }}
                className="w-full h-full relative"
              >
                <SafeImage
                  src={images[activeImageIndex]}
                  alt={product.image_alt || product.name}
                  priority
                />
              </motion.div>
            </motion.div>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                  }}
                  className="absolute left-0 lg:left-1 top-1/2 -translate-y-1/2 text-ink/30 hover:text-rose transition-colors z-10"
                >
                  <ChevronLeft size={24} strokeWidth={2} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                  }}
                  className="absolute right-0 lg:right-1 top-1/2 -translate-y-1/2 text-ink/30 hover:text-rose transition-colors z-10"
                >
                  <ChevronRight size={24} strokeWidth={2} />
                </button>
              </>
            )}
          </motion.div>

          {/* Combined Product Info & Options Column */}
          <div
            className={cn("col-span-1 grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 w-full", !isMobile && photoHeight > 0 && "lg:overflow-y-auto minimal-scroll")}
            style={!isMobile && photoHeight > 0 ? { maxHeight: photoHeight } : undefined}
          >
            {/* Column 3: Product Info */}
            <motion.div variants={columnVariants} className="flex flex-col pt-2 pb-0 lg:py-1 lg:pl-0">
            <div className="space-y-0.5 lg:space-y-1 h-full flex flex-col">
              <div className="space-y-0.5 lg:space-y-1 shrink-0">
                <motion.div variants={textVariants} className="flex items-center gap-2 mb-0.5 lg:mb-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-ink text-white rounded-none w-fit shadow-md">
                    <span className="text-[8px] md:text-[9px] lg:text-[9px] font-medium uppercase tracking-[0.3em]">
                      {product.badge_text || 'STUDIO EDITION'}
                    </span>
                  </div>
                </motion.div>
                <motion.h1 variants={textVariants} className="text-base md:text-base lg:text-lg font-display font-medium italic tracking-tighter text-ink leading-normal uppercase mb-1">{product.name}</motion.h1>
                {reviews.length > 0 && (
                  <motion.div variants={textVariants} className="flex items-center gap-1.5 mb-1.5 mt-0.5">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) ? "currentColor" : "none"} className="text-amber-500" />
                      ))}
                    </div>
                    <span className="text-[10px] md:text-[8px] font-bold text-ink/40 uppercase tracking-widest">{reviews.length} Reviews</span>
                  </motion.div>
                )}
                {product.price_tag && (
                  <motion.div variants={textVariants} className="text-[11px] md:text-[8px] lg:text-[8px] font-medium uppercase tracking-[0.2em] text-rose bg-rose/5 border border-rose/10 px-1.5 lg:px-2.5 py-0.5 lg:py-1 rounded-sm w-fit mt-0.5">
                    {product.price_tag}
                  </motion.div>
                )}
                <motion.div variants={textVariants} className="flex items-center gap-3 mt-0.5">
                  <p className="text-base md:text-sm lg:text-base font-display font-medium italic text-rose">
                    IDR {product.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <div className="flex items-center gap-1.5 border border-rose/20 px-2.5 py-0.5 bg-rose/[0.02] cursor-pointer hover:bg-rose/5 transition-colors group">
                    <span className="text-[10px] md:text-[8px] font-medium text-rose uppercase tracking-[0.2em] flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose group-hover:scale-110 transition-transform">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {product.price_tag === 'SALE' ? 'Redeem Promo' : 'Available Promo'}
                    </span>
                  </div>
                </motion.div>
              </div>

              <div className="space-y-0.5 lg:space-y-1 pt-1 lg:pt-1.5 border-t border-ink/5">
                <motion.h4 variants={textVariants} className="text-sm md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40">{dict.product.description}</motion.h4>
                <motion.p 
                  variants={textVariants} 
                  className="text-base md:text-sm lg:text-sm leading-relaxed text-ink/90 font-medium whitespace-pre-wrap transition-all duration-300"
                  animate={{ opacity: activeInfoTab === 'measurement' && !isWidescreen ? 0.6 : 1 }}
                >
                  {(() => {
                    const desc = localizedDescription || 'Premium quality apparel from NINOC.';
                    const charLimit = (activeInfoTab === 'measurement' && !isWidescreen) ? 80 : 200;
                    if (isExpanded && (activeInfoTab !== 'measurement' || isWidescreen)) return desc;
                    if (desc.length <= charLimit) return desc;
                    return desc.slice(0, charLimit) + '…';
                  })()}
                </motion.p>
                {(localizedDescription || '').length > 200 && (
                  <motion.button
                    variants={textVariants}
                    onClick={() => { 
                      if (!isWidescreen && activeInfoTab === 'measurement') {
                        setIsExpanded(true);
                        setActiveInfoTab('specs');
                      } else {
                        setIsExpanded(!isExpanded);
                      }
                    }}
                    className="text-xs md:text-[9px] lg:text-[9px] font-medium uppercase tracking-[0.2em] text-rose hover:text-ink transition-colors mt-0.5 flex items-center gap-1"
                  >
                    {isExpanded && (activeInfoTab !== 'measurement' || isWidescreen) ? 'Less' : 'More'}
                  </motion.button>
                )}
              </div>

              <div className="pt-1 border-t border-ink/5 mt-1 lg:mt-1.5 sticky top-0 bg-white z-10">
                <motion.div variants={textVariants} className="flex items-center gap-3 mb-1.5">
                  <button
                    onClick={() => setActiveInfoTab('specs')}
                    className={`text-sm md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] transition-colors ${
                      activeInfoTab === 'specs' ? 'text-ink' : 'text-ink/30 hover:text-ink/50'
                    }`}
                  >
                    {dict.product.specs}
                  </button>
                  <span className="text-ink/10">|</span>
                  <button
                    onClick={() => { setActiveInfoTab('measurement'); setIsExpanded(false); }}
                    className={`text-sm md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] transition-colors flex items-center gap-1 ${
                      activeInfoTab === 'measurement' ? 'text-ink' : 'text-ink/30 hover:text-ink/50'
                    }`}
                  >
                    <Ruler size={9} className="text-rose" />
                    {dict.product.measurement}
                  </button>
                </motion.div>

                <div className="mt-1">
                  {activeInfoTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm md:text-[11px]">
                      {displaySpecs.map((spec, idx) => (
                        <motion.div variants={textVariants} key={idx} className="flex justify-between items-center border-b border-ink/5 py-1">
                          <span className="text-ink/40 uppercase tracking-widest text-[11px] md:text-[8px]">{spec.label}</span>
                          <span className="font-semibold text-right">{spec.value}</span>
                        </motion.div>
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
                      {displayMeasurements.map((m, idx) => {
                        const wh = getWeightAndHeight(m.size);
                        const isSelected = effectiveSize && m.size.toUpperCase() === effectiveSize.toUpperCase();
                        return (
                          <motion.div variants={textVariants} key={idx} className={cn(
                            "grid grid-cols-[30px_minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center py-2 border-b last:border-0 transition-colors min-w-[200px]",
                            isSelected ? "border-ink/20 bg-ink/5" : "border-ink/10 hover:border-ink/20 hover:bg-ink/[0.02]"
                          )}>
                            <span className={cn("text-sm md:text-xs font-bold", isSelected ? "text-ink" : "text-ink/90")}>{m.size}</span>
                            <span className={cn("text-xs md:text-[11px] font-mono tracking-wider text-center", isSelected ? "text-ink font-semibold" : "text-ink font-medium")}>{isPants ? `${m.waist || '-'} / ${m.length}` : `${m.chest || '-'} / ${m.length}`}</span>
                            <span className={cn("text-xs md:text-[11px] font-mono tracking-wider text-right", isSelected ? "text-ink font-semibold" : "text-ink font-medium")}>{wh.w} / {wh.h}</span>
                          </motion.div>
                        );
                      })}
                      {displayModelInfo && (
                        <p className="text-[11px] md:text-[8px] text-ink/40 mt-0.5 uppercase font-medium italic">* {displayModelInfo}</p>
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
                  <motion.h4 variants={textVariants} className="text-xs md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2">{dict.product.selectSize}</motion.h4>
                  <div className="flex gap-1.5 lg:gap-3 flex-wrap pr-2">
                    {availableSizes.map((size) => (
                      <motion.button
                        variants={textVariants}
                        key={size}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => { setSelectedSize(size); setQuantity(1); }}
                        className={cn(
                          "h-9 lg:h-10 min-w-[2.5rem] lg:min-w-[3rem] px-2 rounded-none flex items-center justify-center text-xs lg:text-xs font-medium transition-all border relative",
                          effectiveSize === size ? "bg-ink text-white border-ink shadow-md" : "bg-white text-ink border-ink/5 hover:border-ink/20"
                        )}
                      >
                        {size}
                        {isSurchargeSize(size) && (
                          <span className={cn(
                            "absolute -top-1.5 -right-1 text-[6px] font-bold px-1 py-0.5 leading-none rounded-sm shadow-sm",
                            effectiveSize === size ? "bg-white text-rose" : "bg-rose text-white"
                          )}>
                            +15K
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  {currentSurcharge > 0 && (
                    <motion.div variants={textVariants} className="flex items-center gap-1.5 mt-1 px-1">
                      <div className="w-1 h-1 rounded-full bg-rose animate-pulse" />
                      <span className="text-[11px] md:text-[8px] font-medium text-rose uppercase tracking-wider">
                        +IDR {SIZE_SURCHARGE_AMOUNT.toLocaleString('id-ID')} surcharge untuk ukuran {effectiveSize}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="space-y-2 border-t border-ink/5 lg:border-none pt-2 lg:pt-0">
                  <motion.h4 variants={textVariants} className="text-xs md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2">{dict.product.selectColor}</motion.h4>
                  <div className="flex gap-2 flex-wrap">
                    {availableColors.map((color) => {
                      const colorGallery = colorGalleryMap[color];
                      const colorImg = colorGallery?.main;
                      return (
                      <motion.button
                        variants={textVariants}
                        key={color}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => { setSelectedColor(color); setQuantity(1); setActiveImageIndex(0); }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-none text-xs md:text-[10px] lg:text-[11px] font-medium uppercase tracking-wider border transition-all",
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
                </div>
              )}

              <div className="space-y-1.5 lg:space-y-2 mt-2 lg:mt-0">
                <motion.div variants={textVariants} className="flex items-center gap-2 border-b border-ink/5 pb-1 lg:pb-2">
                  <h4 className="text-xs md:text-xs lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40">{dict.product.quantity}</h4>
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
                  <button onClick={() => setQuantity(Math.max(1, displayQuantity - 1))} disabled={availableStock === 0 || displayQuantity <= 1} className="w-6 h-6 flex items-center justify-center transition-all text-ink/40 hover:text-rose disabled:opacity-30"><Minus size={14} strokeWidth={2} /></button>
                  <span className="text-sm md:text-sm lg:text-sm font-medium w-10 text-center text-ink">{displayQuantity}</span>
                  <button onClick={() => setQuantity(displayQuantity + 1)} disabled={availableStock === 0 || displayQuantity >= availableStock} className="w-6 h-6 flex items-center justify-center transition-all text-ink/40 hover:text-rose disabled:opacity-30"><Plus size={14} strokeWidth={2} /></button>
                </motion.div>
              </div>

              {availableStock > 0 && (
                <div className="mt-4 w-full">
                  <motion.button
                    variants={textVariants}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={cn(
                      "w-full py-2.5 lg:py-2.5 rounded-none font-medium text-xs md:text-sm lg:text-[11px] uppercase tracking-[0.3em] lg:tracking-[0.4em] flex items-center justify-center gap-2 lg:gap-4 transition-all relative overflow-hidden group shadow-xl shadow-ink/5",
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
                            <ShoppingCart size={16} />
                            {items.length > 0 && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2.5 w-3.5 h-3.5 bg-rose text-white text-[8px] font-bold flex items-center justify-center rounded-none"
                              >
                                {items.reduce((sum, item) => sum + item.quantity, 0)}
                              </motion.div>
                            )}
                          </div>
                          <span>
                            {isWidescreen ? dict.product.addToCart : dict.product.checkout.toUpperCase()}
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

          <motion.div 
            variants={columnVariants}
            className={cn(
              "col-span-2 2xl:col-span-1 flex-col py-0 lg:py-1 mt-2 lg:mt-0 lg:pl-3 lg:border-l lg:border-ink/5",
              isMobile 
                ? (items.length === 0 ? "hidden" : "flex") 
                : "hidden 2xl:flex"
            )}
          >
            <div className="border border-ink/10 bg-white shadow-sm flex flex-col relative z-20 h-full min-h-[300px]">
              <motion.div variants={textVariants} className="flex justify-between items-center border-b border-ink/5 px-4 py-3">
                <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/40">{dict.product.yourCart}</span>
                <span className="text-xs md:text-[10px] font-medium text-ink">{items.length} {items.length === 1 ? dict.product.item : dict.product.items}</span>
              </motion.div>

              {items.length === 0 ? (
                <motion.div variants={textVariants} className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-4 md:py-10 px-4">
                  <ShoppingCart size={28} className="mb-3 text-ink" />
                  <span className="text-xs md:text-[9px] uppercase tracking-widest text-ink font-medium">{dict.product.cartEmpty}</span>
                  <span className="text-[11px] md:text-[8px] text-ink/40 font-medium mt-1">{dict.product.selectSizeToAdd}</span>
                </motion.div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto divide-y divide-ink/5 minimal-scroll">
                      {items.map((item) => (
                        <motion.div
                          variants={textVariants}
                          key={`${item.id}-${item.size}-${item.color}`}
                          className="flex gap-3 items-start px-4 py-3 group/item hover:bg-ink/[0.01] transition-colors relative"
                        >
                          <div
                            className="w-14 h-16 bg-ink/[0.02] border border-ink/5 relative overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center"
                            onClick={() => {
                              if (item.slug) {
                                router.push(`/shop/${item.slug}`);
                              }
                            }}
                          >
                            {item.image_url && <SafeImage src={item.image_url} alt={item.name} sizes="56px" />}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs md:text-[10px] font-medium uppercase leading-tight text-ink line-clamp-2 pt-0.5">{item.name}</span>
                              <button
                                onClick={() => removeItem(item.id, item.size, item.color)}
                                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-sm text-ink/25 hover:text-white hover:bg-rose border border-transparent hover:border-rose transition-all -mt-0.5 -mr-1"
                                title="Remove from cart"
                              >
                                <Trash2 size={12} strokeWidth={2} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1 mb-auto mt-0.5 relative">
                              <span className="text-[11px] md:text-[8px] font-medium text-ink/60 uppercase tracking-wider">
                                {item.color ? `Color ${item.color} / ` : ''}Size {item.size}
                              </span>
                              {displayMeasurements.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const key = `${item.id}-${item.size}-${item.color}`;
                                    setMeasurementPopupItemKey(prev => prev === key ? null : key);
                                  }}
                                  className="text-rose/50 hover:text-rose transition-colors"
                                  title="View size chart"
                                >
                                  <Ruler size={10} />
                                </button>
                              )}
                              {(item.size_surcharge || 0) > 0 && (
                                <span className="text-[10px] md:text-[7px] font-medium text-rose bg-rose/10 px-1 py-0.5 rounded-sm uppercase tracking-wider">+15K</span>
                              )}
                              {/* Measurement Popover */}
                              {measurementPopupItemKey === `${item.id}-${item.size}-${item.color}` && (
                                <div className="absolute top-full left-0 mt-1 z-50 bg-ink text-white border border-ink shadow-xl p-3 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                                    <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-rose">{dict.product.sizeChart}</span>
                                    <button onClick={() => setMeasurementPopupItemKey(null)} className="text-white/40 hover:text-white">
                                      <X size={10} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-[30px_minmax(0,1fr)_minmax(0,1fr)] gap-1 text-[10px] md:text-[7px] font-medium text-white/40 uppercase tracking-wider mb-1 border-b border-white/10 pb-1">
                                    <span>Size</span>
                                    <span className="text-center">{isPants ? 'W/L/Leg' : 'Chest/L'}</span>
                                    <span className="text-right">Wght/Hght</span>
                                  </div>
                                  {displayMeasurements.map((m, idx) => {
                                    const wh = getWeightAndHeight(m.size);
                                    return (
                                      <div key={idx} className={cn(
                                        "grid grid-cols-[30px_minmax(0,1fr)_minmax(0,1fr)] gap-1 text-[11px] md:text-[8px] font-medium py-1 border-b border-white/5",
                                        m.size.toUpperCase() === (item.size || '').toUpperCase() ? "text-rose" : "text-white/80"
                                      )}>
                                        <span className="font-bold">{m.size}</span>
                                        <span className="text-center">{isPants ? `${m.waist || '-'} / ${m.length} / ${m.leg_opening || '-'}` : `${m.chest || '-'} / ${m.length}`}</span>
                                        <span className="text-right text-white/50">{wh.w} / {wh.h}</span>
                                      </div>
                                    );
                                  })}
                                  {displayModelInfo && (
                                    <p className="text-[10px] md:text-[7px] text-white/30 mt-1.5 italic">* {displayModelInfo}</p>
                                  )}
                                  <div className="absolute -top-1.5 left-4 w-3 h-3 bg-ink rotate-45 border-l border-t border-ink" />
                                </div>
                              )}
                            </div>

                            <motion.div variants={textVariants} className="flex items-center justify-between mt-2 pt-2 border-t border-ink/5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      removeItem(item.id, item.size, item.color);
                                    } else {
                                      updateQuantity(item.id, item.quantity - 1, item.size, item.color);
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center text-ink/40 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm md:text-[11px] font-medium w-5 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                                  className="w-6 h-6 flex items-center justify-center text-ink/40 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs md:text-[9px] font-medium text-rose">
                                  IDR {((item.price + (item.size_surcharge || 0)) * item.quantity).toLocaleString('id-ID')}
                                </span>
                                {(item.size_surcharge || 0) > 0 && (
                                  <span className="text-[10px] md:text-[7px] text-ink/30 font-medium">
                                    incl. +{(item.size_surcharge * item.quantity).toLocaleString('id-ID')} surcharge
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                  </div>

                  <motion.div variants={textVariants} className="border-t border-ink/10 px-4 py-3 space-y-3 bg-ink/[0.01]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">{dict.product.total}</span>
                      <span className="text-sm md:text-[11px] font-medium text-ink">IDR {totalPrice().toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <motion.button
                        variants={textVariants}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push('/checkout')}
                        className="w-full py-3 bg-rose text-white text-xs md:text-[10px] uppercase font-medium tracking-[0.2em] hover:bg-ink transition-colors text-center shadow-md shadow-rose/20"
                      >
                        {dict.product.checkout}
                      </motion.button>
                      <motion.button
                        variants={textVariants}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => clearCart()}
                        className="w-full py-2.5 bg-transparent text-ink/40 text-xs md:text-[9px] uppercase font-medium tracking-[0.2em] hover:text-rose hover:bg-rose/5 transition-colors text-center border border-ink/5 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        {dict.product.clearCart}
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>

        {reviews.length > 0 && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-8 lg:mt-12 border-t border-ink/5 pt-6 lg:pt-8">
            <motion.div variants={textVariants} className="flex justify-between items-end border-b border-ink/5 pb-2 lg:pb-3 mb-4 lg:mb-6">
              <h2 className="text-xs md:text-[10px] font-display font-medium italic tracking-tight text-ink uppercase">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-[10px] font-bold text-ink">{reviews.length}</span>
                <span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/40">Verified Ratings</span>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <motion.div key={r.id} variants={textVariants} className="p-4 md:p-5 bg-ink/[0.01] border border-ink/5 rounded-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-ink/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center text-[10px] font-bold text-ink uppercase">
                        {r.author_name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs md:text-[10px] font-bold text-ink uppercase tracking-wider">{r.author_name}</span>
                        {r.is_verified_purchase && (
                          <span className="text-[9px] md:text-[7px] font-bold uppercase tracking-widest text-emerald-600 mt-0.5 flex items-center gap-0.5">
                            <ShieldCheck size={8} /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < r.rating ? "currentColor" : "none"} className="text-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs md:text-[11px] text-ink/80 leading-relaxed italic">&quot;{r.review_text}&quot;</p>
                  <span className="text-[9px] md:text-[7px] font-medium uppercase tracking-widest text-ink/30 mt-auto pt-2">{new Date(r.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {relatedProducts.length > 0 && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-4 lg:mt-6 space-y-1">
            <motion.div variants={textVariants} className="flex justify-between items-end border-b border-ink/5 pb-1 lg:pb-1.5">
              <h2 className="text-xs md:text-[9px] md:text-[10px] font-display font-medium italic tracking-tight text-ink uppercase">{dict.product.relatedProducts}</h2>
              <Link  href="/shop" className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30 hover:text-rose transition-colors flex items-center gap-1 group mb-0.5">
                {dict.product.viewFullCollection} <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
              {relatedProducts.map((p) => (
                <motion.div
                  variants={textVariants}
                  key={p.id}
                  className="flex-shrink-0 w-[110px] md:w-[130px]"
                >
                  <Link  href={`/shop/${p.slug}`} className="group block space-y-1">
                    <div className="aspect-square rounded-none overflow-hidden bg-white border border-ink/5 shadow-sm group-hover:shadow-lg transition-all duration-500 relative">
                      <div className="absolute inset-3">
                        <SafeImage src={p.image_url} alt={p.image_alt || p.name} className="object-contain group-hover:scale-105 transition-transform duration-700" sizes="130px" />
                      </div>
                      <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <div className="space-y-1 px-1">
                      <h3 className="text-xs md:text-[10px] md:text-xs font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-rose transition-colors leading-tight line-clamp-1">{p.name}</h3>
                      {p.price_tag && (
                        <div className="text-[6px] font-medium uppercase tracking-[0.2em] text-rose mb-0.5">
                          {p.price_tag}
                        </div>
                      )}
                      <p className="text-xs md:text-[9px] font-medium text-rose">IDR {p.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

    </main>
  );
}