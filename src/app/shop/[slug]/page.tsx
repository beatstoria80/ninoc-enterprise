"use client";

import React, { useState, useEffect } from 'react';

import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, ChevronLeft, Ruler, Plus, Minus, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';

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
  perspective1?: string;
  perspective2?: string;
  perspective3?: string;
  perspective4?: string;
  price_tag?: string | null;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
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

  // Platform detection for mobile-specific UI
  const { isMobile, isIPhone } = useDevice();



  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (error) throw error;
        if (data) {
          setProduct(data);
          // Fetch related products
          const { data: related } = await supabase
            .from('products')
            .select('*')
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4);
          setRelatedProducts(related || []);
        }
      } catch (error: unknown) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (isLoading) return <div className="min-h-screen bg-cr flex items-center justify-center font-medium uppercase tracking-[0.5em] text-ink/10 animate-pulse">Initializing Shop Catalog...</div>;
  if (!product) return <div className="min-h-screen bg-cr flex items-center justify-center">Product Not Found.</div>;

  const rawImages = [
    product.image_url,
    product.perspective1,
    product.perspective2,
    product.perspective3,
    product.perspective4
  ].filter((img): img is string => typeof img === 'string' && img.length > 0);

  // Selalu tampilkan 4 thumbnail (1 utama + 3 perspektif). Jika kosong, duplikasi foto utama sebagai placeholder.
  while (rawImages.length < 4) {
    rawImages.push(product.image_url);
  }
  const images = rawImages;

  // Extract unique colors from variants
  const availableColors = product?.variants
    ? [...new Set(product.variants.map(v => v.color).filter(Boolean) as string[])]
    : [];

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, selectedColor);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
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
        "pt-0 md:pt-28 px-4 md:px-10 relative", // Mobile uses MobileLayout's pt-14
        isMobile && "pb-24" 
      )}>

        {/* BACK TO CATALOG NAV - TOP LEFT */}
        <div className="mb-4 lg:mb-6 hidden lg:block">
          <button 
            onClick={() => router.push('/shop')} 
            className="group flex items-center gap-3 text-ink transition-all"
          >
            <div className="w-8 h-8 rounded-none border border-ink/10 flex items-center justify-center group-hover:border-rose group-hover:text-rose transition-colors bg-white">
              <ArrowLeft size={14} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40">Return to</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink group-hover:text-rose transition-colors">Catalog</span>
            </div>
          </button>
        </div>

        {/* ARCHIVAL LAYOUT: Flex Stack (Mobile) | 5-GRID (Desktop) */}
        <div className="flex flex-col lg:grid lg:grid-cols-[100px_1.1fr_1fr_1fr_0.9fr] gap-1.5 lg:gap-4 xl:gap-5 mt-0 lg:mt-2">
          
          {/* GRID 1 — THUMBNAIL STRIP (Desktop Only) */}
          <div className="hidden lg:flex flex-col gap-2 overflow-y-auto no-scrollbar max-h-[55vh] relative pt-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "w-full aspect-[4/5] rounded-none overflow-hidden border-2 transition-all relative group bg-white flex-shrink-0",
                    activeImageIndex === i ? "border-rose opacity-100 shadow-sm" : "border-ink/5 opacity-50 hover:opacity-100 hover:border-ink/15"
                  )}
                >
                  <Image src={img} className="object-contain p-1.5" alt="" fill sizes="100px" />
                </button>
              ))}
          </div>

          {/* GRID 2 — MAIN IMAGE / MOBILE CAROUSEL */}
          <div className="col-span-1 relative flex items-center lg:px-6 xl:px-8 w-full">
            
            {/* MOBILE: Animated Card Preview (Artboard 2) */}
            <div 
              className="flex lg:hidden relative w-full justify-center items-center overflow-hidden py-0 touch-pan-y mt-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Invisible placeholder to perfectly dictate container height without negative space */}
              <div className="w-[75%] aspect-[4/5] invisible pointer-events-none" />

              {images.map((img, idx) => {
                const isActive = idx === activeImageIndex;
                const isPrev = idx === (activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1);
                const isNext = idx === (activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1);
                
                let positionClass = "opacity-0 scale-75 translate-x-0 z-0 pointer-events-none"; // hidden
                if (isActive) positionClass = "opacity-100 scale-100 translate-x-0 z-20 shadow-xl";
                else if (isPrev) positionClass = "opacity-40 scale-[0.85] -translate-x-[65%] z-10 shadow-sm cursor-pointer";
                else if (isNext) positionClass = "opacity-40 scale-[0.85] translate-x-[65%] z-10 shadow-sm cursor-pointer";

                return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (isPrev) setActiveImageIndex(idx);
                      if (isNext) setActiveImageIndex(idx);
                    }}
                    className={cn(
                      "absolute w-[75%] aspect-[4/5] rounded-none bg-white border border-ink/5 flex items-center justify-center transition-all duration-500 ease-out",
                      positionClass
                    )}
                  >
                    <Image src={img} alt={`${product.name} ${idx}`} fill className="object-contain p-4 select-none pointer-events-none" sizes="(max-width: 768px) 65vw, 30vw" />
                  </div>
                );
              })}
            </div>

            {/* DESKTOP: Single Main Image */}
            <div className="hidden lg:flex w-full relative aspect-[4/5] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl items-center justify-center">
              <Image
                src={images[activeImageIndex]}
                alt={product.name}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 50vw, 30vw"
              />
            </div>

            {/* Navigation Arrows (Outside Box, Inside Column Padding) */}
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

          {/* GRID 3 — GARMENT SPECIFICATION */}
          <div className="col-span-1 flex flex-col pt-4 pb-0 lg:py-1 lg:pl-0">
            <div className="space-y-2 lg:space-y-6">
              <div className="space-y-1 lg:space-y-3">
                <div className="flex items-center gap-2 mb-1.5 lg:mb-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ink text-white rounded-none w-fit shadow-md">
                    <span className="text-[7px] lg:text-[8px] font-medium uppercase tracking-[0.3em]">Studio Edition</span>
                  </div>
                </div>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-display font-medium italic tracking-tighter text-ink leading-[0.9] uppercase">{product.name}</h1>
                {product.price_tag && (
                  <div className="text-[7px] lg:text-[9px] font-medium uppercase tracking-[0.2em] text-rose bg-rose/5 border border-rose/10 px-1.5 lg:px-2.5 py-1 lg:py-1.5 rounded-sm w-fit mt-1 lg:mt-2">
                    {product.price_tag}
                  </div>
                )}
                <p className="text-sm md:text-2xl lg:text-3xl font-display font-medium italic text-rose mt-1 lg:mt-2">IDR {product.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>

              <div className="space-y-1 lg:space-y-3 mt-4 lg:mt-0">
                <h4 className="text-[10px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2">Origin Specification</h4>
                <p className="text-[12px] lg:text-[12px] leading-relaxed text-ink/90 font-medium">{product.description || 'Premium quality apparel from NINOC.'}</p>
              </div>

              {/* Size Guide Table - Inline for Grid 3 */}
              <div className="space-y-1.5 lg:space-y-2 mt-4 lg:mt-0">
                <h4 className="text-[10px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2 flex items-center gap-2">
                  <Ruler size={10} className="text-rose" />
                  Measurement (CM)
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-medium"><span className="text-ink/40">SIZE</span><span className="text-ink/40">CHEST / LENGTH</span></div>
                  {['S: 94 / 68', 'M: 100 / 70', 'L: 106 / 72', 'XL: 112 / 74'].map(s => (
                    <div key={s} className="flex justify-between text-[11px] font-medium border-b border-ink/5 pb-1">
                      <span className="text-rose">{s.split(':')[0]}</span>
                      <span>{s.split(':')[1]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-ink/40 mt-2 uppercase font-medium italic">* Model wearing Size M (175cm / 65kg)</p>
              </div>
            </div>
          </div>

          {/* GRID 4 — SELECTION & ACTION */}
          <div className="col-span-1 flex flex-col py-0 lg:py-1 lg:pl-0">
            <div className="space-y-2 lg:space-y-6 flex flex-col h-full">
              {/* Size Selection */}
              <div className="space-y-2 lg:space-y-3 mt-4 lg:mt-0">
                <h4 className="text-[10px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2">Select Size</h4>
                <div className="flex gap-1.5 lg:gap-2 flex-wrap">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-10 h-10 lg:w-12 lg:h-12 rounded-none flex items-center justify-center text-[10px] lg:text-xs font-medium transition-all border",
                        selectedSize === size ? "bg-ink text-white border-ink shadow-md" : "bg-white text-ink border-ink/5 hover:border-ink/20"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Color Selection */}
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
                            selectedColor === color
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

              {/* Quantity */}
              <div className="space-y-1.5 lg:space-y-3 mt-4 lg:mt-0">
                <h4 className="text-[10px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/40 border-b border-ink/5 pb-1 lg:pb-2">Quantity</h4>
                <div className="flex items-center gap-2 lg:gap-4 bg-ink/[0.02] w-fit px-2 lg:px-3 py-1.5 lg:py-2 rounded-none border border-ink/5">
                  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center hover:bg-white rounded-none transition-all text-ink/30 hover:text-rose"><Minus size={14} /></button>
                  <span className="text-[11px] lg:text-[12px] font-medium w-6 lg:w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(prev => prev + 1)} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center hover:bg-white rounded-none transition-all text-ink/30 hover:text-rose"><Plus size={14} /></button>
                </div>
              </div>

              {/* ACTION BUTTON - Sticky on Mobile (Artboard 2) */}
              <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur-md border-t border-ink/10 z-[150] lg:static lg:bg-transparent lg:border-none lg:p-0 lg:z-10 lg:mt-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={cn(
                    "w-full py-4 lg:py-5 rounded-none font-medium text-[11px] lg:text-xs uppercase tracking-[0.3em] lg:tracking-[0.4em] flex items-center justify-center gap-2 lg:gap-4 transition-all relative overflow-hidden group shadow-xl shadow-ink/5",
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

              {/* Trust Badges - Desktop only */}
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

          {/* GRID 5 — CART ARCHIVE (PERMANENT & COMPLETE) */}
          <div className="col-span-2 lg:col-span-1 flex flex-col py-0 lg:py-1 mt-2 lg:mt-0 lg:pl-3 lg:border-l lg:border-ink/5">
            <div className="border border-ink/10 bg-white shadow-sm flex flex-col relative z-20 h-full min-h-[300px]">
              {/* Cart Header */}
              <div className="flex justify-between items-center border-b border-ink/5 px-4 py-3">
                <span className="text-[10px] font-medium uppercase tracking-widest text-ink/40">Your Archive</span>
                <span className="text-[10px] font-medium text-ink">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
              </div>
              
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-10 px-4">
                  <ShoppingCart size={28} className="mb-3 text-ink" />
                  <span className="text-[9px] uppercase tracking-widest text-ink font-medium">Archive is empty</span>
                  <span className="text-[8px] text-ink/40 font-medium mt-1">Select a size and add items</span>
                </div>
              ) : (
                <>
                  {/* Cart Items List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-ink/5 minimal-scroll">
                      {items.map((item) => (
                        <div 
                          key={`${item.id}-${item.size}-${item.color}`}
                          className="flex gap-3 items-start px-4 py-3 group/item hover:bg-ink/[0.01] transition-colors relative"
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-14 bg-ink/[0.02] border border-ink/5 relative overflow-hidden flex-shrink-0">
                            {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" />}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-medium uppercase leading-tight text-ink truncate">{item.name}</span>
                              {/* Delete Button — Always Visible */}
                              <button 
                                onClick={() => removeItem(item.id, item.size, item.color)}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-sm text-ink/25 hover:text-white hover:bg-rose border border-transparent hover:border-rose transition-all"
                                title="Remove from archive"
                              >
                                <Trash2 size={14} strokeWidth={2} />
                              </button>
                            </div>
                            <span className="text-[8px] font-medium text-ink/30 uppercase tracking-wider">
                                    {item.color ? `Color ${item.color} / ` : ''}Size {item.size}
                                  </span>
                            
                            {/* Quantity Controls + Price */}
                            <div className="flex items-center justify-between mt-0.5">
                              <div className="flex items-center gap-0 border border-ink/8">
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      removeItem(item.id, item.size, item.color);
                                    } else {
                                      updateQuantity(item.id, item.quantity - 1, item.size, item.color);
                                    }
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-ink/30 hover:text-rose hover:bg-rose/5 transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-[10px] font-medium w-8 text-center border-x border-ink/8 h-8 flex items-center justify-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                                  className="w-8 h-8 flex items-center justify-center text-ink/30 hover:text-rose hover:bg-rose/5 transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <span className="text-[9px] font-medium text-rose">
                                IDR {(item.price * item.quantity).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {/* Cart Footer — Summary & Actions */}
                  <div className="border-t border-ink/10 px-4 py-3 space-y-3 bg-ink/[0.01]">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-medium uppercase tracking-widest text-ink/40">Total Investment</span>
                      <span className="text-[11px] font-medium text-ink">IDR {totalPrice().toLocaleString('id-ID')}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => router.push('/checkout')} 
                        className="w-full py-3 bg-rose text-white text-[10px] uppercase font-medium tracking-[0.2em] hover:bg-ink transition-colors text-center shadow-md shadow-rose/20"
                      >
                        Secure Checkout
                      </button>
                      <button 
                        onClick={() => clearCart()} 
                        className="w-full py-2.5 bg-transparent text-ink/40 text-[9px] uppercase font-medium tracking-[0.2em] hover:text-rose hover:bg-rose/5 transition-colors text-center border border-ink/5 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        Clear Archive
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION - PREMIUM GRID */}
        {relatedProducts.length > 0 && (
          <div className="mt-4 lg:mt-10 space-y-3">
            <div className="flex justify-between items-end border-b border-ink/5 pb-1.5 lg:pb-2">
              <h2 className="text-base md:text-lg font-display font-medium italic tracking-tight text-ink uppercase">Related <span className="text-rose">Products</span></h2>
              <Link href="/shop" className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30 hover:text-rose transition-colors flex items-center gap-1 group mb-0.5">
                View Full Collection <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-4">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-[140px] md:w-[160px]"
                >
                  <Link href={`/shop/${p.slug}`} className="group block space-y-3">
                    <div className="aspect-[3/4] rounded-none overflow-hidden bg-white border border-ink/5 shadow-sm group-hover:shadow-lg transition-all duration-500 relative">
                      <Image src={p.image_url} alt={p.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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

    </main>
  );
}
