"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, Ruler, Plus, Minus, Paperclip } from 'lucide-react';
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
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Platform detection for mobile-specific UI
  const { isMobile, isIPhone } = useDevice();

  // Set mobile cart visibility after mount — checks actual window width on client
  /* eslint-disable react-hooks/set-state-in-effect */
  // Set mobile cart visibility after mount — checks actual window width on client
  useEffect(() => {
    setShowMobileCart(window.innerWidth < 768);
    const handleResize = () => setShowMobileCart(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const images = [
    product.image_url,
    product.perspective1,
    product.perspective2,
    product.perspective3,
    product.perspective4
  ].filter((img): img is string => !!img && img.startsWith('http'));

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
        "pt-24 md:pt-32 px-4 md:px-10 max-w-[1500px] ml-0 mr-auto",
        isMobile && "pt-14"
      )}>

        {/* DESKTOP ONLY - FIXED BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="fixed left-6 md:left-12 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-4 text-ink/20 hover:text-rose transition-all group hidden xl:flex"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full border border-ink/5 bg-white shadow-sm group-hover:border-rose/20 group-hover:bg-rose/5 group-hover:shadow-xl transition-all duration-500">
            <ArrowLeft size={18} />
          </div>
          <span className="text-[8px] font-medium uppercase tracking-[0.6em] vertical-text transform rotate-180 opacity-0 group-hover:opacity-100 transition-all duration-500">Back to Shop</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 xl:gap-3">
          
          {/* LEFT GALLERY */}
          <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 overflow-y-auto no-scrollbar max-h-[80vh]">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={cn(
                  "w-full aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all relative group bg-white",
                  activeImageIndex === i ? "border-rose scale-[1.05] shadow-xl" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <Image src={img} className="object-contain p-2" alt="" fill />
              </button>
            ))}
          </div>

          {/* MAIN IMAGE - NO CROP PROFESSIONAL STANDARD */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="relative aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] max-h-[85vh] rounded-[24px] overflow-hidden bg-white border border-ink/5 shadow-2xl flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain p-8 md:p-12"
                />
              </AnimatePresence>
              
              {/* Artistic Studio Paperclip - Clipped to the edge */}
              <div className="absolute top-4 right-4 z-20 transform rotate-[30deg] opacity-80 hover:opacity-100 transition-opacity translate-x-1/4 -translate-y-1/4">
                 <div className="relative">
                    <Paperclip size={40} strokeWidth={1.5} className="text-ink/80 drop-shadow-md" />
                 </div>
              </div>
              
              {/* Mobile Indicators */}
              <div className="absolute bottom-6 flex lg:hidden gap-2">
                 {images.map((_, i) => (
                    <div key={i} className={cn("w-2 h-2 rounded-full", activeImageIndex === i ? "bg-rose" : "bg-ink/10")} />
                 ))}
              </div>
            </div>
          </div>

          {/* INFO PANEL - COMPACT & REFINED (GRID 3 START) */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col py-2">
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-ink text-white rounded-full text-[7px] font-medium uppercase tracking-[0.2em]">Authentic Product</span>
                  <div className="flex gap-0.5 text-rose/40"><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /></div>
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-medium italic tracking-tighter text-ink leading-[0.9] uppercase">{product.name}</h1>
                <p className="text-2xl md:text-3xl font-display font-medium italic text-rose">Rp {product.price?.toLocaleString('id-ID')}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-2">Product Description</h4>
                  <p className="text-[13px] leading-relaxed text-ink/60 font-medium">{product.description || 'Premium quality apparel from NINOC Archive.'}</p>
                </div>

                {/* Size Selection & Guide Positioning */}
                <div className="space-y-4 relative">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">Select Size</h4>
                    
                    {/* Size Guide - Repositioned to Right Side Area */}
                    <div className="relative">
                      <div className="group/guide">
                        <button className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.2em] text-rose">
                          <Ruler size={10} />
                          <span className="border-b border-rose/10">Size Guide</span>
                        </button>
                        
                        {/* THE TABLE - Repositioned to the RIGHT as requested to avoid overlapping images/desc */}
                        <div className="absolute top-0 left-full ml-10 w-72 bg-white border border-ink/10 shadow-[40px_0_80px_rgba(0,0,0,0.1)] rounded-2xl p-6 opacity-0 -translate-x-4 pointer-events-none group-hover/guide:opacity-100 group-hover/guide:translate-x-0 transition-all z-50">
                           <div className="absolute left-0 top-6 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-ink/10 rotate-[-45deg]" />
                           <h5 className="text-[10px] font-medium uppercase tracking-widest mb-4 border-b border-ink/5 pb-2">Measurement (CM)</h5>
                           <div className="space-y-3">
                              <div className="flex justify-between text-[9px] font-medium"><span className="text-ink/40">SIZE</span><span className="text-ink/40">CHEST / LENGTH</span></div>
                              {['S: 94 / 68', 'M: 100 / 70', 'L: 106 / 72', 'XL: 112 / 74'].map(s => (
                                 <div key={s} className="flex justify-between text-[10px] font-medium border-b border-ink/5 pb-1">
                                    <span className="text-rose">{s.split(':')[0]}</span>
                                    <span>{s.split(':')[1]}</span>
                                 </div>
                              ))}
                           </div>
                           <p className="text-[7px] text-ink/20 mt-4 uppercase font-medium italic">* Model wearing Size M (175cm / 65kg)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {['S', 'M', 'L', 'XL'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-medium transition-all border",
                          selectedSize === size ? "bg-ink text-white border-ink shadow-md scale-105" : "bg-white text-ink border-ink/5 hover:border-ink/20"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-3">
                  <h4 className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30">Quantity</h4>
                  <div className="flex items-center gap-4 bg-ink/[0.02] w-fit px-3 py-1.5 rounded-xl border border-ink/5">
                    <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-full transition-all text-ink/30 hover:text-rose"><Minus size={12} /></button>
                    <span className="text-[10px] font-medium w-4 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-full transition-all text-ink/30 hover:text-rose"><Plus size={12} /></button>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON - REFINED SCALE */}
              <div className="pt-4 relative z-10">
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={cn(
                    "w-full py-5 rounded-2xl font-medium text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all relative overflow-hidden group shadow-xl shadow-ink/5",
                    addedToCart ? "bg-emerald-500 text-white" : "bg-ink text-white hover:bg-rose active:scale-95"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {addedToCart ? (
                      <motion.span initial={{ y: 15 }} animate={{ y: 0 }} exit={{ y: -15 }} className="flex items-center gap-2">
                        <ShieldCheck size={16} /> ADDED
                      </motion.span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <ShoppingCart size={16} />
                        <span>ADD TO CART</span>
                      </div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Trust Badges - Desktop only */}
              {!isMobile && (
              <div className="grid grid-cols-3 gap-4 pt-10 border-t border-ink/5">
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
        </div>

        {/* RELATED PRODUCTS SECTION - PREMIUM GRID */}
        {relatedProducts.length > 0 && (
          <div className="mt-40 space-y-16">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-ink/5 pb-8">
              <div className="space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-rose">You Might Also Like</span>
                <h2 className="text-4xl md:text-6xl font-display font-medium italic tracking-tighter text-ink uppercase">Related <span className="text-rose">Archive</span></h2>
              </div>
              <Link href="/shop" className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/30 hover:text-rose transition-colors flex items-center gap-2 group mb-2 md:mb-0">
                View Full Collection <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/shop/${p.slug}`} className="group block space-y-6">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-ink/5 shadow-sm group-hover:shadow-2xl transition-all duration-500 relative">
                      <Image src={p.image_url} alt={p.name} fill className="object-contain p-6 group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1 px-2">
                      <h3 className="text-sm md:text-base font-display font-medium italic uppercase tracking-tight text-ink group-hover:text-rose transition-colors">{p.name}</h3>
                      <p className="text-xs font-medium text-rose">Rp {p.price?.toLocaleString('id-ID')}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY BOTTOM CTA — show based on actual window width, bypasses SSR hydration issues */}
      {showMobileCart && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 z-[350] bg-white/95 backdrop-blur-xl border-t border-ink/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-2">
          <div className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink/50">Total</p>
              <p className="text-lg font-display font-medium italic text-rose">Rp {product.price?.toLocaleString('id-ID')}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={cn(
                "px-8 py-4 rounded-xl font-medium text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 transition-all",
                addedToCart ? "bg-emerald-500 text-white" : "bg-ink text-white"
              )}
            >
              {addedToCart ? (
                <>
                  <ShieldCheck size={14} />
                  <span>ADDED</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  <span>ADD TO CART</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
