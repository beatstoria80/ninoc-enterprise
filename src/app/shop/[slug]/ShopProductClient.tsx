"use client";

import React, { useState, useEffect } from 'react';

import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, ChevronLeft, Ruler, Plus, Minus, Trash2, X, ImageOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import ImageLightbox from '@/components/ImageLightbox';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80';

function SafeImage({ src, alt, className, sizes, priority = false }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean;
}) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  return (
    <>
      {!primaryFailed && (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-contain", className)}
          sizes={sizes || "(max-width: 768px) 50vw, 30vw"}
          priority={priority}
          unoptimized
          onError={() => setPrimaryFailed(true)}
        />
      )}
      {primaryFailed && !fallbackFailed && (
        <Image
          src={FALLBACK_IMAGE}
          alt={alt}
          fill
          className={cn("object-contain", className)}
          sizes={sizes || "(max-width: 768px) 50vw, 30vw"}
          unoptimized
          onError={() => setFallbackFailed(true)}
        />
      )}
      {primaryFailed && fallbackFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-ink/20 bg-ink/[0.02]">
          <ImageOff size={20} />
        </div>
      )}
    </>
  );
}

interface Product {
  id: string; name: string; slug: string; description: string; price: number;
  image_url: string; category: string;
  perspective1?: string; perspective2?: string;
  perspective3?: string; perspective4?: string;
  price_tag?: string | null;
  variants?: { id: string; size: string | null; color: string | null; stock_quantity: number }[];
  specifications?: { label: string; value: string }[] | null;
}

export default function ShopProductClient({ slug }: { slug: string }) {
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
  const [addedToCart2, setAddedToCart2] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const { isMobile, isIPhone } = useDevice();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, variants(*)')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        if (data) {
          setProduct(data);

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
                event: '*', schema: 'public', table: 'variants',
                filter: `product_id=eq.${data.id}`
              }, () => { fetchProduct(); })
              .subscribe();
          } catch {
            console.warn('Realtime subscription unavailable — stock will update on page reload.');
          }
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch {}
      }
    };
  }, [slug]);

  if (isLoading) return (
    <div className="min-h-screen bg-cr flex items-center justify-center font-medium uppercase tracking-[0.5em] text-ink/10 animate-pulse">
      Initializing Shop Catalog...
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-cr flex items-center justify-center font-medium uppercase tracking-[0.5em] text-ink/10 animate-pulse">
      Product Not Found
    </div>
  );

  const allSizes = Array.from(new Set(
    product.variants?.map(v => v.size).filter(Boolean) as string[]
  ));

  const effectiveSize = (() => {
    if (!product?.variants?.length) return selectedSize;
    const allSizes2 = Array.from(new Set(product.variants.map(v => v.size).filter(Boolean) as string[]));
    if (allSizes2.includes(selectedSize)) return selectedSize;
    return allSizes2[0] || '';
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

  const rawImages = [
    product.image_url,
    product.perspective1,
    product.perspective2,
    product.perspective3,
    product.perspective4,
  ].filter((img): img is string => typeof img === 'string' && img.length > 0);

  const images = rawImages.length > 0 ? rawImages : [FALLBACK_IMAGE];

  const availableColors = Array.from(new Set(
    product?.variants?.filter(v => v.size === effectiveSize && v.color).map(v => v.color as string) || []
  ));

  const selectedVariant = product?.variants?.find(v => v.size === effectiveSize && (v.color === effectiveColor || (!v.color && !effectiveColor)));
  const availableStock = selectedVariant ? selectedVariant.stock_quantity : 0;
  const displayQuantity = availableStock === 0 ? 0 : Math.min(quantity, availableStock);

  const handleAddToCart = () => {
    if (availableStock === 0) return;
    addItem(product, effectiveSize, effectiveColor, quantity);
    setAddedToCart(true);
    setAddedToCart2(true);
    setTimeout(() => {
      setAddedToCart(false);
      setAddedToCart2(false);
    }, 2000);
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.changedTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const distance = touchStart - e.changedTouches[0].clientX;
    if (distance > 40) setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    if (distance < -40) setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    setTouchStart(null);
  };

  return (
    <main className={cn("min-h-screen bg-cr noise", isIPhone && "ios-mobile-layout")}>
      <div className={cn("pt-0 md:pt-24 lg:pt-32 px-4 md:px-10 relative", isMobile && "pb-24")}>

        <div className="flex flex-col lg:grid lg:grid-cols-[85px_1.25fr_1fr_1fr_0.9fr] lg:items-start lg:align-items-start gap-1.5 lg:gap-4 xl:gap-5 mt-0 lg:mt-2">

          {/* Thumbnails */}
          <div className="hidden lg:block relative h-[85px] w-full shrink-0">
            <div className="absolute inset-0 flex flex-col gap-2 overflow-y-auto no-scrollbar pt-2 pb-2 pr-1">
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

          {/* Image Gallery */}
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
                let positionClass = isActive ? 'z-10 opacity-100' : 'z-0 opacity-0';
                if (isPrev) positionClass = 'z-5 opacity-40 translate-x-[-8%] scale-95';
                if (isNext) positionClass = 'z-5 opacity-40 translate-x-[8%] scale-95';
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIndex(prev => prev === idx ? prev : idx)}
                    onAnimationEnd={() => idx === activeImageIndex && setFullscreenImage(img)}
                    className={cn(
                      "absolute w-[75%] aspect-[4/5] rounded-none bg-white border border-ink/5 flex items-center justify-center transition-all duration-500 ease-out",
                      positionClass
                    )}
                  >
                    <SafeImage src={img} alt={`${product.name} ${idx}`} className="object-contain p-4" sizes="(max-width: 768px) 65vw, 30vw" />
                  {isActive && (
                    <div onClick={() => setFullscreenImage(img)}
                      className="absolute inset-0 cursor-zoom-in" />
                  )}
                  {isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setFullscreenImage(img); }}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm border border-ink/10 rounded-full flex items-center justify-center text-ink/40 hover:text-rose transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    </button>
                  )}
                </div>
                );
              })}
            </div>

            <div className="hidden lg:flex w-full relative aspect-[4/5] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl items-center justify-center">
              <SafeImage src={images[activeImageIndex]} alt={product.name} priority />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm border border-ink/10 rounded-full flex items-center justify-center text-ink/40 hover:text-rose transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm border border-ink/10 rounded-full flex items-center justify-center text-ink/40 hover:text-rose transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              <button
                onClick={() => setFullscreenImage(images[activeImageIndex])}
                className="absolute bottom-2 right-2 w-9 h-9 bg-white/80 backdrop-blur-sm border border-ink/10 rounded-full flex items-center justify-center text-ink/40 hover:text-rose transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="col-span-1 flex flex-col pt-2 pb-0 lg:py-1 lg:h-full">
            <div className="space-y-0.5 lg:space-y-1 shrink-0">
              <div className="flex items-center gap-2 mb-0.5 lg:mb-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-ink text-white rounded-none w-fit shadow-md">
                  <span className="text-[6px] lg:text-[7px] font-medium uppercase tracking-[0.3em]">Studio Edition</span>
                </div>
                {product.price_tag && (
                  <span className="px-1.5 py-0.5 bg-rose/10 text-rose border border-rose/20 text-[6px] lg:text-[7px] font-semibold uppercase tracking-[0.2em] rounded-none w-fit">
                    {product.price_tag}
                  </span>
                )}
              </div>
              <h1 className="text-base md:text-xl lg:text-2xl font-display font-medium italic text-ink leading-tight tracking-tight uppercase">
                {product.name}
              </h1>
              <p className="text-lg md:text-2xl lg:text-3xl font-display font-black text-rose mt-0.5">
                IDR {product.price?.toLocaleString('id-ID')}
              </p>
            </div>

            {availableStock > 0 && availableStock <= 5 && (
              <div className="flex items-center gap-1.5 text-[9px] text-amber-600 font-medium uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Hanya {availableStock} tersisa</span>
              </div>
            )}
            {availableStock === 0 && (
              <div className="flex items-center gap-1.5 text-[9px] text-red-500 font-medium uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Stok habis</span>
              </div>
            )}

            <div className="hidden lg:block space-y-3 pt-3 border-t border-ink/5 mt-3">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest text-ink/30 mb-1">Size</p>
                <div className="flex flex-wrap gap-1">
                  {allSizes.map(size => {
                    const inStock = product.variants?.some(v => v.size === size && v.stock_quantity > 0) || false;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border transition-colors rounded-none",
                          inStock ? 'cursor-pointer' : 'cursor-not-allowed opacity-30',
                          effectiveSize === size
                            ? 'bg-ink text-white border-ink'
                            : 'bg-white text-ink border-ink/20 hover:border-ink/40'
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
              {availableColors.length > 0 && (
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-widest text-ink/30 mb-1">Warna</p>
                  <div className="flex flex-wrap gap-1">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border transition-colors rounded-none",
                          effectiveColor === color
                            ? 'bg-ink text-white border-ink'
                            : 'bg-white text-ink border-ink/20 hover:border-ink/40'
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium uppercase tracking-widest text-ink/30">Qty</p>
                  {availableStock > 0 && <span className="text-[9px] text-ink/30">{displayQuantity}x @ IDR {(product.price || 0).toLocaleString('id-ID')}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-ink/10">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-ink/40 hover:text-rose transition-colors">
                      <Minus size={12} />
                    </button>
                    <div className="w-10 text-center text-[11px] font-medium text-ink border-x border-ink/5">{displayQuantity}</div>
                    <button onClick={() => setQuantity(q => Math.min(availableStock, q + 1))} className="w-8 h-8 flex items-center justify-center text-ink/40 hover:text-rose transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={availableStock === 0}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-semibold uppercase tracking-widest border transition-colors",
                      availableStock > 0
                        ? 'bg-rose text-white border-rose hover:bg-rose/90 cursor-pointer'
                        : 'bg-ink/5 text-ink/20 border-ink/10 cursor-not-allowed'
                    )}
                  >
                    {availableStock === 0 ? 'Stok Habis' : addedToCart2 ? 'Ditambahkan!' : 'Tambah'}
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                className={cn(
                  "w-full py-3 text-[10px] font-semibold uppercase tracking-widest border transition-colors flex items-center justify-center gap-2",
                  availableStock > 0
                    ? 'bg-ink text-white border-ink hover:bg-ink/90'
                    : 'bg-ink/5 text-ink/20 border-ink/10 cursor-not-allowed'
                )}
              >
                <ShoppingCart size={14} />
                {availableStock === 0 ? 'Stok Habis' : addedToCart ? 'Ditambahkan!' : 'Tambah ke Keranjang'}
              </button>
              <AnimatePresence>
                {addedToCart && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-center text-[9px] text-rose font-medium uppercase tracking-wider">
                    ✓ {effectiveSize && `Size ${effectiveSize}`} {effectiveColor && `• Warna ${effectiveColor}`} {quantity > 1 && `• Qty ${quantity}`} ditambahkan ke keranjang
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center justify-between text-[8px] text-ink/20 uppercase tracking-widest pt-1">
                <span>Free Shipping</span>
                <span>•</span>
                <span>Easy Returns</span>
                <span>•</span>
                <span>Quality Assured</span>
              </div>
            </div>

            {/* Mobile add to cart */}
            <div className="lg:hidden mt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] text-ink/30 font-medium uppercase tracking-wider">
                <div className="flex-1 border-t border-ink/5" />
                <span>Quick Add</span>
                <div className="flex-1 border-t border-ink/5" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock === 0}
                  className={cn(
                    "flex-1 py-3 text-[9px] font-semibold uppercase tracking-widest border transition-colors flex items-center justify-center gap-2",
                    availableStock > 0
                      ? 'bg-rose text-white border-rose hover:bg-rose/90'
                      : 'bg-ink/5 text-ink/20 border-ink/10'
                  )}
                >
                  <ShoppingCart size={14} />
                  {availableStock === 0 ? 'Stok Habis' : addedToCart ? 'Ditambahkan!' : 'Add to Cart'}
                </button>
                <button onClick={handleAddToCart} disabled={availableStock === 0}
                  className="w-12 h-12 border border-ink/10 flex items-center justify-center text-ink/40 hover:text-rose transition-colors disabled:opacity-30">
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="col-span-1 space-y-3 lg:space-y-4 pt-2 lg:pt-4">
            {/* Expandable description */}
            <div className="border-b border-ink/5 pb-3 lg:pb-4">
              <button onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-start justify-between text-left gap-2">
                <div className="space-y-1 flex-1">
                  <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30">Description</p>
                  <p className={cn("text-[10px] leading-relaxed text-ink/60", !isExpanded && "line-clamp-2")}>
                    {product.description}
                  </p>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-ink/20 shrink-0 mt-4 transition-transform", isExpanded && "rotate-90")} />
              </button>
            </div>

            {/* Specifications */}
            <div className="space-y-2">
              {product.specifications?.map(spec => (
                <div key={spec.label} className="flex items-start justify-between gap-4">
                  <span className="text-[8px] font-medium uppercase tracking-widest text-ink/30 shrink-0 w-24">{(spec.label as string).replace(/_/g, ' ')}</span>
                  <span className="text-[9px] text-ink text-right">{spec.value}</span>
                </div>
              ))}
              {(!product.specifications || product.specifications.length === 0) && (
                <div className="space-y-2">
                  {[
                    { label: 'Jenis Atasan', value: product.category },
                    { label: 'Bahan', value: 'Katun' },
                    { label: 'Gaya', value: 'Basic' },
                  ].map(spec => (
                    <div key={spec.label} className="flex items-start justify-between gap-4">
                      <span className="text-[8px] font-medium uppercase tracking-widest text-ink/30 shrink-0 w-24">{spec.label}</span>
                      <span className="text-[9px] text-ink text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related */}
            {relatedProducts.length > 0 && (
              <div className="pt-3 border-t border-ink/5 space-y-2">
                <p className="text-[8px] font-medium uppercase tracking-[0.4em] text-ink/30">Related</p>
                <div className="space-y-1.5">
                  {relatedProducts.map(p => (
                    <Link key={p.id} href={`/shop/${p.slug}`} className="flex items-center gap-2 group">
                      <div className="w-10 h-10 bg-ink/5 border border-ink/5 overflow-hidden relative shrink-0">
                        {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-medium uppercase truncate">{p.name}</p>
                        <p className="text-[8px] text-ink/40">IDR {p.price?.toLocaleString('id-ID')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Size/Color Selector */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-ink/5 p-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
              {allSizes.map(size => {
                const inStock = product.variants?.some(v => v.size === size && v.stock_quantity > 0) || false;
                return (
                  <button key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "shrink-0 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider border transition-colors",
                      inStock ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed',
                      effectiveSize === size ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink/10'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-10 border border-ink/10 flex items-center justify-center text-ink/40">
                <Minus size={12} />
              </button>
              <span className="w-6 text-center text-[11px] font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(availableStock, q + 1))} className="w-8 h-10 border border-ink/10 flex items-center justify-center text-ink/40">
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <div className="relative w-full max-w-3xl aspect-[4/3]"
            onClick={e => e.stopPropagation()}>
            <Image
              src={fullscreenImage}
              alt={product.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </main>
  );
}
