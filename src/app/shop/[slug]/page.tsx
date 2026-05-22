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
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

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

  if (isLoading) return <div className="min-h-screen bg-cr flex items-center justify-center font-medium uppercase tracking-[0.5em] text-ink/10 animate-pulse">Initializing Shop System...</div>;
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

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <main className={cn("min-h-screen bg-cr noise", isIPhone && "ios-mobile-layout")}>
      {/* MOBILE NAV BAR */}
      {isMobile && (
        <nav className={cn(
          "fixed top-0 inset-x-0 z-[150] bg-white/95 backdrop-blur-xl border-b border-ink/5",
          isIPhone && "pt-[env(safe-area-inset-top)]"
        )}>
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-ink/40 hover:text-rose transition-all">
              <ArrowLeft size={16} />
            </button>
            <div className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">NINOC</div>
            <div className="w-8" />
          </div>
        </nav>
      )}

      <div className={cn(
        "pt-12 md:pt-28 px-4 md:px-10 relative",
        isMobile && "pt-14"
      )}>

        {/* ============================================================ */}
        {/* DESKTOP LAYOUT — 5-Column Archival Grid (lg and above)       */}
        {/* ============================================================ */}

        {/* BACK TO CATALOG NAV - TOP LEFT (Desktop only) */}
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

        {/* 5-GRID ARCHIVAL LAYOUT: Thumbnails | Image | Spec | Action | Cart */}
        <div className="hidden lg:grid lg:grid-cols-[100px_1.1fr_1fr_1fr_0.9fr] lg:gap-4 xl:gap-5 mt-2">
          
          {/* GRID 1 — THUMBNAIL STRIP */}
          <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar max-h-[55vh] relative pt-2">
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

          {/* GRID 2 — MAIN IMAGE */}
          <div className="relative flex items-center px-6 xl:px-8">
            <div className="w-full relative aspect-[4/5] max-h-[55vh] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl flex items-center justify-center">
              <Image
                src={images[activeImageIndex]}
                alt={product.name}
                fill
                className="object-contain p-2"
                sizes="30vw"
              />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                  }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 text-ink/30 hover:text-rose transition-colors z-10"
                >
                  <ChevronLeft size={24} strokeWidth={2} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-ink/30 hover:text-rose transition-colors z-10"
                >
                  <ChevronRight size={24} strokeWidth={2} />
                </button>
              </>
            )}
          </div>

          {/* GRID 3 — GARMENT SPECIFICATION */}
          <div className="flex flex-col py-1">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-ink text-white rounded-full text-[7px] font-medium uppercase tracking-[0.2em]">Authentic</span>
                  <div className="flex gap-0.5 text-rose/40"><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /></div>
                </div>
                <h1 className="text-4xl font-display font-medium italic tracking-tighter text-ink leading-[0.9] uppercase">{product.name}</h1>
                {product.price_tag && (
                  <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-rose bg-rose/5 border border-rose/10 px-2.5 py-1.5 rounded-sm w-fit mt-2">
                    {product.price_tag}
                  </div>
                )}
                <p className="text-3xl font-display font-medium italic text-rose mt-2">IDR {product.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-2">Origin Specification</h4>
                <p className="text-[12px] leading-relaxed text-ink/60 font-medium">{product.description || 'Premium quality apparel from NINOC.'}</p>
              </div>

              {/* Size Guide Table */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-2 flex items-center gap-2">
                  <Ruler size={10} className="text-rose" />
                  Measurement (CM)
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-medium"><span className="text-ink/40">SIZE</span><span className="text-ink/40">CHEST / LENGTH</span></div>
                  {['S: 94 / 68', 'M: 100 / 70', 'L: 106 / 72', 'XL: 112 / 74'].map(s => (
                    <div key={s} className="flex justify-between text-[9px] font-medium border-b border-ink/5 pb-1">
                      <span className="text-rose">{s.split(':')[0]}</span>
                      <span>{s.split(':')[1]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[7px] text-ink/20 mt-2 uppercase font-medium italic">* Model wearing Size M (175cm / 65kg)</p>
              </div>
            </div>
          </div>

          {/* GRID 4 — SELECTION & ACTION */}
          <div className="flex flex-col py-1">
            <div className="space-y-6 flex flex-col h-full">
              {/* Size Selection */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-2">Select Size</h4>
                <div className="flex gap-2 flex-wrap">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-10 h-10 rounded-none flex items-center justify-center text-[10px] font-medium transition-all border",
                        selectedSize === size ? "bg-ink text-white border-ink shadow-md" : "bg-white text-ink border-ink/5 hover:border-ink/20"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-2">Quantity</h4>
                <div className="flex items-center gap-4 bg-ink/[0.02] w-fit px-3 py-1.5 rounded-none border border-ink/5">
                  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-none transition-all text-ink/30 hover:text-rose"><Minus size={10} /></button>
                  <span className="text-[10px] font-medium w-4 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-none transition-all text-ink/30 hover:text-rose"><Plus size={10} /></button>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-4 relative z-10 mt-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={cn(
                    "w-full py-5 rounded-none font-medium text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all relative overflow-hidden group shadow-xl shadow-ink/5",
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
            </div>
          </div>

          {/* GRID 5 — CART ARCHIVE (PERMANENT & COMPLETE) */}
          <div className="flex flex-col py-1 pl-3 border-l border-ink/5">
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
                          key={`${item.id}-${item.size}`}
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
                              {/* Delete Button */}
                              <button 
                                onClick={() => removeItem(item.id, item.size)}
                                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-sm text-ink/25 hover:text-white hover:bg-rose border border-transparent hover:border-rose transition-all"
                                title="Remove from archive"
                              >
                                <Trash2 size={10} strokeWidth={2} />
                              </button>
                            </div>
                            <span className="text-[8px] font-medium text-ink/30 uppercase tracking-wider">Size {item.size}</span>
                            
                            {/* Quantity Controls + Price */}
                            <div className="flex items-center justify-between mt-0.5">
                              <div className="flex items-center gap-0 border border-ink/8">
                                <button 
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      removeItem(item.id, item.size);
                                    } else {
                                      updateQuantity(item.id, item.quantity - 1, item.size);
                                    }
                                  }}
                                  className="w-5 h-5 flex items-center justify-center text-ink/30 hover:text-rose hover:bg-rose/5 transition-colors"
                                >
                                  <Minus size={8} />
                                </button>
                                <span className="text-[9px] font-medium w-5 text-center border-x border-ink/8 h-5 flex items-center justify-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                  className="w-5 h-5 flex items-center justify-center text-ink/30 hover:text-rose hover:bg-rose/5 transition-colors"
                                >
                                  <Plus size={8} />
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
                        className="w-full py-2.5 bg-rose text-white text-[9px] uppercase font-medium tracking-[0.2em] hover:bg-ink transition-colors text-center shadow-md shadow-rose/20"
                      >
                        Secure Checkout
                      </button>
                      <button 
                        onClick={() => clearCart()} 
                        className="w-full py-2 bg-transparent text-ink/30 text-[8px] uppercase font-medium tracking-[0.2em] hover:text-rose hover:bg-rose/5 transition-colors text-center border border-ink/5 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={9} />
                        Clear Archive
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION - DESKTOP ONLY */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 lg:mt-10 space-y-3 hidden lg:block">
            <div className="flex justify-between items-end border-b border-ink/5 pb-2">
              <h2 className="text-lg font-display font-medium italic tracking-tight text-ink uppercase">Related <span className="text-rose">Products</span></h2>
              <Link href="/shop" className="text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30 hover:text-rose transition-colors flex items-center gap-1 group mb-0.5">
                View Full Collection <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-[160px]"
                >
                  <Link href={`/shop/${p.slug}`} className="group block space-y-3">
                    <div className="aspect-[3/4] rounded-none overflow-hidden bg-white border border-ink/5 shadow-sm group-hover:shadow-lg transition-all duration-500 relative">
                      <Image src={p.image_url} alt={p.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1 px-1">
                      <h3 className="text-xs font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-rose transition-colors leading-tight line-clamp-1">{p.name}</h3>
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


        {/* ============================================================ */}
        {/* MOBILE LAYOUT — Artboard 2 Wireframe (below lg)              */}
        {/* ============================================================ */}
        <div className="block lg:hidden">
          <div className="max-w-3xl mx-auto space-y-3 pb-20">
            
            {/* BACK NAV */}
            <button 
              onClick={() => router.push('/shop')} 
              className="group flex items-center gap-2 text-ink transition-all mb-4"
            >
              <div className="w-6 h-6 border border-ink flex items-center justify-center group-hover:border-rose group-hover:text-rose transition-colors bg-white">
                <ArrowLeft size={10} />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink group-hover:text-rose transition-colors">Catalog</span>
            </button>

            {/* TOP SECTION: 3 PHOTO LAYOUT */}
            <div className="flex justify-center items-stretch gap-2 h-[45vh]">
              {/* Left Photo Perspective */}
              <button 
                onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                className="w-1/4 relative bg-white border border-ink transition-all hover:bg-ink/[0.02] active:scale-[0.98] group flex-shrink-0"
              >
                 <Image src={images[(activeImageIndex - 1 + images.length) % images.length]} fill alt="Perspective Left" className="object-contain p-2" />
              </button>
              
              {/* Center Photo Utama */}
              <div className="w-2/4 relative bg-white border border-ink shadow-sm z-10">
                 <Image src={images[activeImageIndex]} fill alt={product.name} className="object-contain p-2" priority />
                 <div className="absolute top-2 left-2 px-1.5 py-0.5 border border-ink text-[6px] font-medium uppercase tracking-[0.2em] text-ink bg-white">UTAMA</div>
                 
                 {/* Controls */}
                 <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                   {images.map((_, i) => (
                      <div key={i} className={cn("h-1 rounded-none transition-all", activeImageIndex === i ? "w-4 bg-ink" : "w-1.5 bg-ink/20")} />
                   ))}
                 </div>
              </div>

              {/* Right Photo Perspective */}
              <button 
                onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                className="w-1/4 relative bg-white border border-ink transition-all hover:bg-ink/[0.02] active:scale-[0.98] group flex-shrink-0"
              >
                 <Image src={images[(activeImageIndex + 1) % images.length]} fill alt="Perspective Right" className="object-contain p-2" />
              </button>
            </div>

            {/* MIDDLE CONTENT BLOCKS (BOX GRID) */}
            <div className="flex flex-col gap-2 pt-2">
              
              {/* Row 1: Title/Price & Size Grid */}
              <div className="flex flex-col gap-2">
                <div className="flex-1 bg-white border border-ink p-3 flex flex-col justify-center">
                   <h1 className="text-xl font-display font-medium italic tracking-tighter uppercase leading-[0.9] text-ink">{product.name}</h1>
                   <div className="flex items-center gap-3 mt-1.5">
                     <p className="text-sm font-medium text-rose tracking-tight">IDR {product.price?.toLocaleString('id-ID')}</p>
                     {product.price_tag && <span className="text-[6px] border border-rose/30 bg-rose/5 text-rose uppercase tracking-[0.2em] px-1 py-0.5">{product.price_tag}</span>}
                   </div>
                </div>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "flex-1 w-12 min-h-[50px] border flex items-center justify-center text-xs font-medium transition-all",
                        selectedSize === size ? "bg-ink text-white border-ink shadow-sm" : "bg-white text-ink border-ink hover:bg-ink/5"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Origin Spec Header & Quantity */}
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-ink p-2 px-4 flex items-center">
                  <h4 className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink">Origin Specification</h4>
                </div>
                <div className="w-[104px] bg-white border border-ink flex items-center justify-between px-2 flex-shrink-0">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 flex items-center justify-center hover:text-rose"><Minus size={10}/></button>
                  <span className="text-[10px] font-medium text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 flex items-center justify-center hover:text-rose"><Plus size={10}/></button>
                </div>
              </div>

              {/* Row 3: Description Box */}
              <div className="bg-white border border-ink p-4 min-h-[120px]">
                <p className="text-[10px] leading-relaxed text-ink/80 font-medium">{product.description || 'Premium aesthetic collection from NINOC Archive.'}</p>
                
                <div className="flex items-center gap-1.5 mt-4">
                  <span className="px-1.5 py-0.5 bg-ink text-white text-[5px] font-medium uppercase tracking-[0.2em]">Authentic</span>
                  <div className="flex gap-0.5 text-rose/40"><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /></div>
                </div>
              </div>

              {/* Row 4: Measurement Header */}
              <div className="bg-white border border-ink p-2 px-4 flex items-center">
                <h4 className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink">Measurement & Archive</h4>
              </div>

              {/* Row 5: Large Box (Measurement & Cart) */}
              <div className="bg-white border border-ink p-4 flex flex-col gap-6">
                {/* Measurement */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[7px] font-medium border-b border-ink/20 pb-1.5"><span className="text-ink/50 uppercase tracking-widest">Size</span><span className="text-ink/50 uppercase tracking-widest">Chest / Length</span></div>
                  {['S: 94 / 68', 'M: 100 / 70', 'L: 106 / 72', 'XL: 112 / 74'].map(s => (
                    <div key={s} className="flex justify-between text-[8px] font-medium border-b border-ink/5 pb-1.5 mt-1.5">
                      <span className="text-rose">{s.split(':')[0]}</span>
                      <span>{s.split(':')[1]}</span>
                    </div>
                  ))}
                  <p className="text-[6px] text-ink/30 mt-3 uppercase font-medium italic">* Model wearing Size M (175cm / 65kg)</p>
                </div>
                
                {/* Cart Summary Box */}
                <div className="border-t border-ink/10 pt-4 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                     <h4 className="text-[8px] font-medium uppercase tracking-widest text-ink flex items-center gap-1.5"><ShoppingCart size={10} className="text-rose"/> Cart Summary</h4>
                     <span className="text-[8px] font-medium bg-ink/5 px-1.5 py-0.5">{items.length} Items</span>
                  </div>
                  
                  {/* Mini cart items preview */}
                  <div className="flex-1 overflow-y-auto minimal-scroll pr-1 max-h-[120px] mb-3 space-y-2">
                    {items.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[8px] uppercase tracking-widest text-ink/30 font-medium">Archive Empty</div>
                    ) : (
                      items.map(item => (
                        <div key={`${item.id}-${item.size}`} className="flex justify-between items-center text-[8px] font-medium bg-ink/[0.02] p-1.5 border border-ink/5">
                          <span className="truncate max-w-[100px] text-ink/70">{item.name} ({item.size}) x{item.quantity}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-rose">{(item.price * item.quantity).toLocaleString()}</span>
                            <button onClick={() => removeItem(item.id, item.size)} className="text-ink/20 hover:text-rose"><Trash2 size={8}/></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-ink/10 flex justify-between items-center mt-auto">
                    <span className="text-[7px] font-medium uppercase tracking-widest text-ink/50">Total</span>
                    <span className="text-xs font-medium text-rose">IDR {totalPrice().toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={handleAddToCart}
                disabled={addedToCart}
                className={cn(
                  "w-full py-4 mt-2 border-2 text-[10px] uppercase font-medium tracking-[0.4em] transition-all flex items-center justify-center gap-2",
                  addedToCart ? "bg-emerald-500 border-emerald-500 text-white" : "bg-ink border-ink text-white hover:bg-rose hover:border-rose"
                )}
              >
                {addedToCart ? (
                  <><ShieldCheck size={14} /> ADDED TO ARCHIVE</>
                ) : (
                  <><ShoppingCart size={14} /> ADD TO CART</>
                )}
              </button>
            </div>
            
            {/* SECURE BADGES */}
            <div className="flex justify-center gap-4 opacity-40 mt-4 pb-10">
               <div className="flex items-center gap-1 text-[6px] font-medium uppercase tracking-widest"><ShieldCheck size={8}/> Secure</div>
               <div className="w-[1px] h-2 bg-ink/20"/>
               <div className="flex items-center gap-1 text-[6px] font-medium uppercase tracking-widest"><RefreshCw size={8}/> Returns</div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
