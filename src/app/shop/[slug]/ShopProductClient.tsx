"use client";

import React, { useState, useEffect } from 'react';

import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, ChevronLeft, Ruler, Plus, Minus, Trash2, X, ImageOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import ImageLightbox from '@/components/ImageLightbox';

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
        <span className="text-[7px] font-medium uppercase tracking-widest">Image Unavailable</span>
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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  perspective1?: string;
  perspective2?: string;
  perspective3?: string;
  perspective4?: string;
  price_tag?: string | null;
  badge_text?: string | null;
  variants?: { id: string; size: string | null; color: string | null; stock_quantity: number }[];
  specifications?: { label: string; value: string }[] | null;
  measurements?: { size: string; chest: string; length: string }[] | null;
  model_info?: string | null;
}

interface ShopProductClientProps {
  slug: string;
  productSchema?: string | null;
}

export default function ShopProductClient({ slug, productSchema }: ShopProductClientProps) {
  const router = useRouter();
  const { addItem, removeItem, updateQuantity, clearCart, items, totalPrice } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
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

  // Default fallbacks if admin does not provide data
  const DEFAULT_SPECS = [
    { label: 'Jenis Atasan', value: 'Kaos' },
    { label: 'Bahan', value: 'Katun' },
    { label: 'Gaya', value: 'Basic' },
    { label: 'Motif', value: 'Lainnya' },
    { label: 'Panjang Lengan', value: 'Lengan Pendek' },
    { label: 'Garis Leher', value: 'Kerah Bulat' },
  ];
  const DEFAULT_MEASUREMENTS_STANDARD = [
    { size: 'S', chest: '96', length: '68' },
    { size: 'M', chest: '100', length: '70' },
    { size: 'L', chest: '104', length: '72' },
    { size: 'XL', chest: '108', length: '74' },
    { size: 'XXL', chest: '112', length: '76' },
    { size: '3XL', chest: '116', length: '78' },
    { size: '4XL', chest: '120', length: '80' },
  ];

  const DEFAULT_MEASUREMENTS_OVERSIZE = [
    { size: 'S', chest: '106', length: '70' },
    { size: 'M', chest: '112', length: '72' },
    { size: 'L', chest: '118', length: '74' },
    { size: 'XL', chest: '124', length: '76' },
    { size: 'XXL', chest: '130', length: '78' },
    { size: '3XL', chest: '136', length: '80' },
    { size: '4XL', chest: '142', length: '82' },
  ];

  const fitTypeSpec = product?.specifications?.find(s => s.label.toLowerCase().includes('fit') || s.label.toLowerCase().includes('potongan'));
  const isOversize = fitTypeSpec?.value.toLowerCase().includes('oversize');

  const DEFAULT_MODEL_INFO_STANDARD = "Model wearing Size M (175cm / 65kg)";
  const DEFAULT_MODEL_INFO_OVERSIZE = "Model wearing Size M Oversize (175cm / 65kg)";

  const displaySpecs = product?.specifications && product.specifications.length > 0 ? product.specifications : DEFAULT_SPECS;
  const fallbackMeasurements = isOversize ? DEFAULT_MEASUREMENTS_OVERSIZE : DEFAULT_MEASUREMENTS_STANDARD;
  const displayMeasurements = product?.measurements && product.measurements.length > 0 ? product.measurements : fallbackMeasurements;
  const fallbackModelInfo = isOversize ? DEFAULT_MODEL_INFO_OVERSIZE : DEFAULT_MODEL_INFO_STANDARD;
  const displayModelInfo = product?.model_info || fallbackModelInfo;

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const timeout = setTimeout(() => setIsLoading(false), 10000); // 10s fallback

    const fetchProduct = async (isRefetch = false) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, variants(*)')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        if (data) {
          setProduct(data);

          if (!isRefetch) {
            const { data: related } = await supabase
              .from('products')
              .select('*')
              .eq('category', data.category)
              .neq('id', data.id)
              .limit(4);
            setRelatedProducts(related || []);

            try {
              channel = supabase
                .channel(`variants-stock-${data.id}`)
                .on('postgres_changes', {
                  event: '*',
                  schema: 'public',
                  table: 'variants',
                  filter: `product_id=eq.${data.id}`
                }, () => {
                  fetchProduct(true);
                })
                .subscribe();
            } catch {
              console.warn('Realtime subscription unavailable — stock will update on page reload.');
            }
          }
        }
      } catch (error: unknown) {
        console.error('Failed to fetch product:', error);
      } finally {
        clearTimeout(timeout);
        if (!isRefetch) setIsLoading(false);
      }
    };
    fetchProduct();

    return () => {
      clearTimeout(timeout);
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* ignore */ }
      }
    };
  }, [slug]);

  const availableSizes = (() => {
    if (!product?.variants?.length) return ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
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

    // Fallback to default if somehow variants exist but have no sizes
    return sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
  })();

  const effectiveSize = (() => {
    if (availableSizes.includes(selectedSize)) return selectedSize;
    return availableSizes[0] || selectedSize;
  })();

  const effectiveColor = (() => {
    if (!product?.variants?.length) return selectedColor;
    const colorsForSize = Array.from(new Set(
      product.variants.filter(v => v.size === effectiveSize && v.color).map(v => v.color as string)
    ));
    if (colorsForSize.length > 0 && !colorsForSize.includes(selectedColor)) return colorsForSize[0];
    if (colorsForSize.length === 0 && selectedColor !== '') return '';
    return selectedColor;
  })();

  if (isLoading) return <div className="min-h-screen bg-cr flex items-center justify-center font-medium uppercase tracking-[0.5em] text-ink/10 animate-pulse">Initializing Shop Catalog...</div>;
  if (!product) return <div className="min-h-screen bg-cr flex items-center justify-center">Product Not Found.</div>;

  const rawImages = [
    product.image_url,
    product.perspective1,
    product.perspective2,
    product.perspective3,
    product.perspective4
  ].filter((img): img is string => typeof img === 'string' && img.length > 0);

  while (rawImages.length < 4) {
    rawImages.push(product.image_url);
  }
  const images = rawImages;

  const availableColors = Array.from(new Set(
    product?.variants?.filter(v => v.size === effectiveSize && v.color).map(v => v.color as string) || []
  ));

  const selectedVariant = product?.variants?.find(v => v.size === effectiveSize && (v.color === effectiveColor || (!v.color && !effectiveColor)));
  const availableStock = selectedVariant ? selectedVariant.stock_quantity : 0;
  const displayQuantity = availableStock === 0 ? 0 : Math.min(quantity, availableStock);

  const isSurchargeSize = (size: string) => SURCHARGE_SIZES.some(s => s.toUpperCase() === size.toUpperCase());
  const currentSurcharge = isSurchargeSize(effectiveSize) ? SIZE_SURCHARGE_AMOUNT : 0;

  const handleAddToCart = () => {
    if (product) {
      if (availableStock === 0) return;
      const surcharge = isSurchargeSize(effectiveSize) ? SIZE_SURCHARGE_AMOUNT : 0;
      for (let i = 0; i < displayQuantity; i++) {
        addItem(product, effectiveSize, effectiveColor, surcharge);
      }
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
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
        "pt-0 md:pt-24 lg:pt-32 px-4 md:px-10 relative",
        isMobile && "pb-24"
      )}>

        <div className="flex flex-col lg:grid lg:grid-cols-[85px_1.25fr_1fr_1fr_0.9fr] lg:items-start lg:align-items-start gap-1.5 lg:gap-4 xl:gap-5 mt-0 lg:mt-2">

          <div className="hidden lg:block w-full shrink-0">
            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pt-2 pb-2 pr-1 max-h-[600px]">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "w-full aspect-square rounded-none overflow-hidden border-2 transition-all relative group bg-white flex-shrink-0",
                    activeImageIndex === i ? "border-rose opacity-100 shadow-sm" : "border-ink/5 opacity-50 hover:opacity-100 hover:border-ink/15"
                  )}
                >
                  <SafeImage src={img} alt={product.name} className="object-contain p-1.5" sizes="100px" />
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-1 relative flex items-center lg:px-6 xl:px-8 w-full lg:self-start">

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
                    <SafeImage src={img} alt={`${product.name} ${idx}`} className="object-contain p-4" sizes="(max-width: 768px) 65vw, 30vw" />
                  </div>
                );
              })}
            </div>

            <div className="hidden lg:flex w-full relative aspect-[4/5] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl items-center justify-center">
              <SafeImage
                src={images[activeImageIndex]}
                alt={product.name}
                priority
              />
            </div>

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
          </div>

          <div className="col-span-1 flex flex-col pt-2 pb-0 lg:py-1 lg:pl-0 lg:h-full">
            <div className="space-y-0.5 lg:space-y-1 h-full flex flex-col">
              <div className="space-y-0.5 lg:space-y-1 shrink-0">
                <div className="flex items-center gap-2 mb-0.5 lg:mb-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-ink text-white rounded-none w-fit shadow-md">
                    <span className="text-[6px] lg:text-[7px] font-medium uppercase tracking-[0.3em]">
                      {product.badge_text || 'STUDIO EDITION'}
                    </span>
                  </div>
                </div>
                <h1 className="text-[11px] md:text-base lg:text-lg font-display font-medium italic tracking-tighter text-ink leading-normal uppercase mb-1">{product.name}</h1>
                {product.price_tag && (
                  <div className="text-[7px] lg:text-[9px] font-medium uppercase tracking-[0.2em] text-rose bg-rose/5 border border-rose/10 px-1.5 lg:px-2.5 py-0.5 lg:py-1 rounded-sm w-fit mt-0.5">
                    {product.price_tag}
                  </div>
                )}
                <p className="text-[11px] md:text-sm lg:text-base font-display font-medium italic text-rose mt-0.5">IDR {product.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>

              <div className="space-y-0.5 lg:space-y-1 pt-1 lg:pt-1.5 border-t border-ink/5">
                <h4 className="text-[9px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40">Description</h4>
                <p className="text-[11px] md:text-xs lg:text-sm leading-relaxed text-ink/90 font-medium whitespace-pre-wrap">
                  {isExpanded || (product.description || '').length <= 200
                    ? product.description || 'Premium quality apparel from NINOC.'
                    : (product.description || '').slice(0, 200) + '…'}
                </p>
                {(product.description || '').length > 200 && (
                  <button
                    onClick={() => { setIsExpanded(!isExpanded); setActiveInfoTab('specs'); }}
                    className="text-[8px] lg:text-[9px] font-medium uppercase tracking-[0.2em] text-rose hover:text-ink transition-colors mt-0.5 flex items-center gap-1"
                  >
                    {isExpanded ? 'Less' : 'More'}
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-ink/5 mt-1 lg:mt-1.5 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3 mb-1.5">
                  <button
                    onClick={() => setActiveInfoTab('specs')}
                    className={`text-[9px] lg:text-[10px] font-medium uppercase tracking-[0.3em] transition-colors ${
                      activeInfoTab === 'specs' ? 'text-ink' : 'text-ink/30 hover:text-ink/50'
                    }`}
                  >
                    Spesifikasi
                  </button>
                  <span className="text-ink/10">|</span>
                  <button
                    onClick={() => { setActiveInfoTab('measurement'); setIsExpanded(false); }}
                    className={`text-[9px] lg:text-[10px] font-medium uppercase tracking-[0.3em] transition-colors flex items-center gap-1 ${
                      activeInfoTab === 'measurement' ? 'text-ink' : 'text-ink/30 hover:text-ink/50'
                    }`}
                  >
                    <Ruler size={9} className="text-rose" />
                    Measurement (CM)
                  </button>
                </div>

                <div className="mt-1">
                  {activeInfoTab === 'specs' && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                      {displaySpecs.map((spec, idx) => (
                        <div key={idx} className="flex flex-col border-b border-ink/5 pb-0.5">
                          <span className="text-ink/40 uppercase tracking-widest text-[8px]">{spec.label}</span>
                          <span className="font-semibold">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeInfoTab === 'measurement' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-medium"><span className="text-ink/40">SIZE</span><span className="text-ink/40">CHEST / LENGTH</span></div>
                      {displayMeasurements.map((m, idx) => (
                        <div key={idx} className="flex justify-between text-[10px] font-medium border-b border-ink/5 pb-0.5">
                          <span className="text-rose">{m.size}</span>
                          <span>{m.chest} / {m.length}</span>
                        </div>
                      ))}
                      {displayModelInfo && (
                        <p className="text-[8px] text-ink/40 mt-0.5 uppercase font-medium italic">* {displayModelInfo}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 flex flex-col py-0 lg:py-1 lg:pl-0">
            <div className="space-y-2 lg:space-y-6 flex flex-col h-full">
              <div className="space-y-1.5 lg:space-y-3 mt-1 lg:mt-0 border-t border-ink/5 lg:border-none pt-2 lg:pt-0">
                <h4 className="text-[10px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2">Select Size</h4>
                <div className="flex gap-1.5 lg:gap-2 flex-wrap">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-10 h-10 lg:w-11 lg:h-11 rounded-none flex items-center justify-center text-[10px] lg:text-xs font-medium transition-all border relative",
                        effectiveSize === size ? "bg-ink text-white border-ink shadow-md" : "bg-white text-ink border-ink/5 hover:border-ink/20"
                      )}
                    >
                      {size}
                      {isSurchargeSize(size) && (
                        <span className={cn(
                          "absolute -top-1.5 -right-2 text-[6px] font-bold px-1 py-0.5 leading-none rounded-sm shadow-sm",
                          effectiveSize === size ? "bg-white text-rose" : "bg-rose text-white"
                        )}>
                          +15K
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {currentSurcharge > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <div className="w-1 h-1 rounded-full bg-rose animate-pulse" />
                    <span className="text-[8px] font-medium text-rose uppercase tracking-wider">
                      +IDR {SIZE_SURCHARGE_AMOUNT.toLocaleString('id-ID')} surcharge untuk ukuran {effectiveSize}
                    </span>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2">Select Color</h4>
                    <div className="flex gap-2 flex-wrap">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "px-3 py-1.5 rounded-none text-[9px] lg:text-[10px] font-medium uppercase tracking-wider border transition-all",
                            effectiveColor === color
                              ? "bg-ink text-white border-ink"
                              : "bg-white text-ink/60 border-ink/10 hover:border-ink/30"
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 lg:space-y-2 mt-2 lg:mt-0">
                <div className="flex items-center gap-2 border-b border-ink/5 pb-1 lg:pb-2">
                  <h4 className="text-[10px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40">Quantity</h4>
                  {availableStock > 0 ? (
                    <span className="text-[8px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 uppercase tracking-wider">
                      {availableStock} in stock
                    </span>
                  ) : (
                    <span className="text-[8px] font-medium text-rose bg-rose/5 px-1.5 py-0.5 uppercase tracking-wider">
                      Out of stock
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 w-fit border border-ink/10 px-3 py-2 rounded-none bg-white">
                  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} disabled={availableStock === 0} className="w-6 h-6 flex items-center justify-center transition-all text-ink/40 hover:text-rose disabled:opacity-30"><Minus size={14} strokeWidth={2} /></button>
                  <span className="text-[14px] font-medium w-10 text-center text-ink">{displayQuantity}</span>
                  <button onClick={() => setQuantity(prev => Math.min(availableStock, prev + 1))} disabled={availableStock === 0 || quantity >= availableStock} className="w-6 h-6 flex items-center justify-center transition-all text-ink/40 hover:text-rose disabled:opacity-30"><Plus size={14} strokeWidth={2} /></button>
                </div>
              </div>

              {availableStock > 0 && (
                <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur-md border-t border-ink/10 z-[150] lg:static lg:bg-transparent lg:border-none lg:p-0 lg:z-10 lg:mt-auto">
                  <button
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={cn(
                      "w-full py-3 lg:py-3 rounded-none font-medium text-[11px] lg:text-xs uppercase tracking-[0.3em] lg:tracking-[0.4em] flex items-center justify-center gap-2 lg:gap-4 transition-all relative overflow-hidden group shadow-xl shadow-ink/5",
                      addedToCart ? "bg-emerald-500 text-white" : "bg-ink text-white hover:bg-rose"
                    )}
                  >
                      {addedToCart ? (
                        <span className="flex items-center gap-2">
                          <ShieldCheck size={16} /> ADDED
                        </span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <ShoppingCart size={16} />
                          <span>ADD TO CART</span>
                        </div>
                      )}
                  </button>
                </div>
              )}

              {!isMobile && (
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-ink/5 mt-6">
                  {[
                    { icon: ShieldCheck, label: 'Secure Payment' },
                    { icon: Truck, label: 'Express Shipping' },
                    { icon: RefreshCw, label: 'Easy Returns' }
                  ].map((badge, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity text-center">
                      <badge.icon size={14} className="text-rose" />
                      <span className="text-[7px] font-medium uppercase tracking-widest leading-tight">{badge.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={cn(
            "col-span-2 lg:col-span-1 flex flex-col py-0 lg:py-1 mt-2 lg:mt-0 lg:pl-3 lg:border-l lg:border-ink/5",
            isMobile && items.length === 0 ? "hidden lg:flex" : "flex"
          )}>
            <div className="border border-ink/10 bg-white shadow-sm flex flex-col relative z-20 h-full min-h-[300px]">
              <div className="flex justify-between items-center border-b border-ink/5 px-4 py-3">
                <span className="text-[10px] font-medium uppercase tracking-widest text-ink/40">Your Cart</span>
                <span className="text-[10px] font-medium text-ink">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
              </div>

              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-10 px-4">
                  <ShoppingCart size={28} className="mb-3 text-ink" />
                  <span className="text-[9px] uppercase tracking-widest text-ink font-medium">Cart is empty</span>
                  <span className="text-[8px] text-ink/40 font-medium mt-1">Select a size and add items</span>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto divide-y divide-ink/5 minimal-scroll">
                      {items.map((item) => (
                        <div
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
                              <span className="text-[10px] font-medium uppercase leading-tight text-ink truncate pt-0.5">{item.name}</span>
                              <button
                                onClick={() => removeItem(item.id, item.size, item.color)}
                                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-sm text-ink/25 hover:text-white hover:bg-rose border border-transparent hover:border-rose transition-all -mt-0.5 -mr-1"
                                title="Remove from cart"
                              >
                                <Trash2 size={12} strokeWidth={2} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1 mb-auto mt-0.5 relative">
                              <span className="text-[8px] font-medium text-ink/60 uppercase tracking-wider">
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
                                <span className="text-[7px] font-medium text-rose bg-rose/10 px-1 py-0.5 rounded-sm uppercase tracking-wider">+15K</span>
                              )}
                              {/* Measurement Popover */}
                              {measurementPopupItemKey === `${item.id}-${item.size}-${item.color}` && (
                                <div className="absolute top-full left-0 mt-1 z-50 bg-ink text-white border border-ink shadow-xl p-3 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
                                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                                    <span className="text-[8px] font-medium uppercase tracking-widest text-rose">Size Chart</span>
                                    <button onClick={() => setMeasurementPopupItemKey(null)} className="text-white/40 hover:text-white">
                                      <X size={10} />
                                    </button>
                                  </div>
                                  <div className="flex justify-between text-[7px] font-medium text-white/40 uppercase tracking-wider mb-1">
                                    <span>Size</span><span>Chest / Length</span>
                                  </div>
                                  {displayMeasurements.map((m, idx) => (
                                    <div key={idx} className={cn(
                                      "flex justify-between text-[9px] font-medium py-0.5 border-b border-white/5",
                                      m.size.toUpperCase() === (item.size || '').toUpperCase() ? "text-rose" : "text-white/80"
                                    )}>
                                      <span>{m.size}</span>
                                      <span>{m.chest} / {m.length}</span>
                                    </div>
                                  ))}
                                  {displayModelInfo && (
                                    <p className="text-[7px] text-white/30 mt-1.5 italic">* {displayModelInfo}</p>
                                  )}
                                  <div className="absolute -top-1.5 left-4 w-3 h-3 bg-ink rotate-45 border-l border-t border-ink" />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink/5">
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
                                <span className="text-[11px] font-medium w-5 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                                  className="w-6 h-6 flex items-center justify-center text-ink/40 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] font-medium text-rose">
                                  IDR {((item.price + (item.size_surcharge || 0)) * item.quantity).toLocaleString('id-ID')}
                                </span>
                                {(item.size_surcharge || 0) > 0 && (
                                  <span className="text-[7px] text-ink/30 font-medium">
                                    incl. +{(item.size_surcharge * item.quantity).toLocaleString('id-ID')} surcharge
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="border-t border-ink/10 px-4 py-3 space-y-3 bg-ink/[0.01]">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-medium uppercase tracking-widest text-ink/40">Total</span>
                      <span className="text-[11px] font-medium text-ink">IDR {totalPrice().toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => router.push('/checkout')}
                        className="w-full py-3 bg-rose text-white text-[10px] uppercase font-medium tracking-[0.2em] hover:bg-ink transition-colors text-center shadow-md shadow-rose/20"
                      >
                        Checkout
                      </button>
                      <button
                        onClick={() => clearCart()}
                        className="w-full py-2.5 bg-transparent text-ink/40 text-[9px] uppercase font-medium tracking-[0.2em] hover:text-rose hover:bg-rose/5 transition-colors text-center border border-ink/5 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        Clear Cart
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-4 lg:mt-6 space-y-1">
            <div className="flex justify-between items-end border-b border-ink/5 pb-1 lg:pb-1.5">
              <h2 className="text-[9px] md:text-[10px] font-display font-medium italic tracking-tight text-ink uppercase">Related <span className="text-rose">Products</span></h2>
              <Link prefetch={false} href="/shop" className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30 hover:text-rose transition-colors flex items-center gap-1 group mb-0.5">
                View Full Collection <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-[110px] md:w-[130px]"
                >
                  <Link prefetch={false} href={`/shop/${p.slug}`} className="group block space-y-1">
                    <div className="aspect-square rounded-none overflow-hidden bg-white border border-ink/5 shadow-sm group-hover:shadow-lg transition-all duration-500 relative">
                      <div className="absolute inset-3">
                        <SafeImage src={p.image_url} alt={p.name} className="object-contain group-hover:scale-105 transition-transform duration-700" sizes="130px" />
                      </div>
                      <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <div className="space-y-1 px-1">
                      <h3 className="text-[10px] md:text-xs font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-rose transition-colors leading-tight line-clamp-1">{p.name}</h3>
                      {p.price_tag && (
                        <div className="text-[6px] font-medium uppercase tracking-[0.2em] text-rose mb-0.5">
                          {p.price_tag}
                        </div>
                      )}
                      <p className="text-[9px] font-medium text-rose">IDR {p.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageLightbox
        isOpen={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />

    </main>
  );
}