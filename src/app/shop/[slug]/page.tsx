"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, ChevronLeft, Ruler, Plus, Minus } from 'lucide-react';
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
  const { addItem, items, totalPrice } = useCart();
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
        "pt-12 md:pt-28 px-4 md:px-10 max-w-[1500px] ml-0 mr-auto relative",
        isMobile && "pt-14"
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

        {/* 4-GRID ARCHIVAL LAYOUT: Thumbnails | Image | Spec | Action */}
        <div className="grid grid-cols-2 lg:grid-cols-[56px_1fr_1fr_1fr] gap-3 lg:gap-4 xl:gap-5 mt-4 lg:mt-2">
          
          {/* GRID 1 — THUMBNAIL STRIP */}
          <div className="hidden lg:flex flex-col gap-3 overflow-y-auto no-scrollbar max-h-[55vh] relative pt-2">
            <AnimatePresence>
              {images.map((img, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.15), duration: 0.4, ease: "easeOut" }}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "w-full aspect-[3/4] rounded-none overflow-hidden border transition-all relative group bg-white",
                    activeImageIndex === i ? "border-rose opacity-100" : "border-ink/5 opacity-40 hover:opacity-100"
                  )}
                >
                  <Image src={img} className="object-contain p-2" alt="" fill />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* GRID 2 — MAIN IMAGE (UNCHANGED) */}
          <div className="col-span-1 group/mainimg">
            <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] lg:max-h-[55vh] rounded-none overflow-hidden bg-white border border-ink/5 shadow-2xl flex items-center justify-center">
              <motion.img
                key={activeImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                src={images[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain p-2"
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                    }}
                    className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 bg-white/80 hover:bg-white text-ink/40 hover:text-rose flex items-center justify-center border border-ink/10 opacity-100 lg:opacity-0 lg:group-hover/mainimg:opacity-100 transition-all rounded-none z-10"
                  >
                    <ChevronLeft size={20} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                    }}
                    className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 bg-white/80 hover:bg-white text-ink/40 hover:text-rose flex items-center justify-center border border-ink/10 opacity-100 lg:opacity-0 lg:group-hover/mainimg:opacity-100 transition-all rounded-none z-10"
                  >
                    <ChevronRight size={20} strokeWidth={1.5} />
                  </button>
                </>
              )}
              
              {/* Mobile Indicators */}
              <div className="absolute bottom-6 flex lg:hidden gap-2">
                 {images.map((_, i) => (
                    <div key={i} className={cn("w-2 h-2 rounded-full", activeImageIndex === i ? "bg-rose" : "bg-ink/10")} />
                 ))}
              </div>
            </div>
          </div>

          {/* GRID 3 — GARMENT SPECIFICATION */}
          <div className="col-span-1 flex flex-col py-0 lg:py-1">
            <div className="space-y-4 lg:space-y-6">
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center gap-1.5 lg:gap-3">
                  <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-ink text-white rounded-full text-[5px] lg:text-[7px] font-medium uppercase tracking-[0.2em]">Authentic</span>
                  <div className="flex gap-0.5 text-rose/40"><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /></div>
                </div>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-display font-medium italic tracking-tighter text-ink leading-[0.9] uppercase">{product.name}</h1>
                {product.price_tag && (
                  <div className="text-[7px] lg:text-[9px] font-medium uppercase tracking-[0.2em] text-rose bg-rose/5 border border-rose/10 px-1.5 lg:px-2.5 py-1 lg:py-1.5 rounded-sm w-fit mt-1 lg:mt-2">
                    {product.price_tag}
                  </div>
                )}
                <p className="text-sm md:text-2xl lg:text-3xl font-display font-medium italic text-rose mt-1 lg:mt-2">IDR {product.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>

              <div className="space-y-1.5 lg:space-y-3">
                <h4 className="text-[8px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-1 lg:pb-2">Origin Specification</h4>
                <p className="text-[9px] lg:text-[12px] leading-relaxed text-ink/60 font-medium line-clamp-3 lg:line-clamp-none">{product.description || 'Premium quality apparel from NINOC.'}</p>
              </div>

              {/* Size Guide Table - Inline for Grid 3 */}
              <div className="space-y-2">
                <h4 className="text-[8px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-1 lg:pb-2 flex items-center gap-2">
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
          <div className="col-span-1 flex flex-col py-0 lg:py-1">
            <div className="space-y-4 lg:space-y-6 flex flex-col h-full">
              {/* Size Selection */}
              <div className="space-y-3">
                <h4 className="text-[8px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-1 lg:pb-2">Select Size</h4>
                <div className="flex gap-1 lg:gap-2 flex-wrap">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-6 h-6 lg:w-10 lg:h-10 rounded-none flex items-center justify-center text-[8px] lg:text-[10px] font-medium transition-all border",
                        selectedSize === size ? "bg-ink text-white border-ink shadow-md" : "bg-white text-ink border-ink/5 hover:border-ink/20"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5 lg:space-y-3">
                <h4 className="text-[8px] lg:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/30 border-b border-ink/5 pb-1 lg:pb-2">Quantity</h4>
                <div className="flex items-center gap-2 lg:gap-4 bg-ink/[0.02] w-fit px-1.5 lg:px-3 py-1 lg:py-1.5 rounded-none border border-ink/5">
                  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-4 h-4 lg:w-6 lg:h-6 flex items-center justify-center hover:bg-white rounded-none transition-all text-ink/30 hover:text-rose"><Minus size={10} /></button>
                  <span className="text-[9px] lg:text-[10px] font-medium w-4 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(prev => prev + 1)} className="w-4 h-4 lg:w-6 lg:h-6 flex items-center justify-center hover:bg-white rounded-none transition-all text-ink/30 hover:text-rose"><Plus size={10} /></button>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2 lg:pt-4 relative z-10 mt-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={cn(
                    "w-full py-2.5 lg:py-5 rounded-none font-medium text-[9px] lg:text-xs uppercase tracking-[0.2em] lg:tracking-[0.4em] flex items-center justify-center gap-2 lg:gap-4 transition-all relative overflow-hidden group shadow-xl shadow-ink/5",
                    addedToCart ? "bg-emerald-500 text-white" : "bg-ink text-white hover:bg-rose"
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

              {/* MINI CART SUMMARY IN GRID 4 */}
              {items.length > 0 && (
                <div className="mt-4 border border-ink/10 p-3 bg-white shadow-sm flex flex-col gap-3 relative z-20">
                  <div className="flex justify-between items-center border-b border-ink/5 pb-2">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink/40">Your Archive</span>
                    <span className="text-[10px] font-medium text-ink">{items.length} Items</span>
                  </div>
                  
                  <div className="max-h-[140px] overflow-y-auto no-scrollbar space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="w-10 h-10 bg-ink/5 relative overflow-hidden flex-shrink-0">
                           {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                           <span className="text-[9px] font-medium uppercase leading-tight truncate text-ink">{item.name}</span>
                           <span className="text-[8px] font-medium text-ink/40">Size: {item.size} • Qty: {item.quantity}</span>
                        </div>
                        <div className="text-[9px] font-medium text-rose whitespace-nowrap">
                          {((item.price * item.quantity)/1000).toFixed(0)}k
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-ink/5">
                     <span className="text-[9px] font-medium uppercase tracking-widest text-ink/60">Total Value</span>
                     <span className="text-[10px] font-medium text-rose">IDR {totalPrice().toLocaleString('id-ID')}</span>
                  </div>
                  
                  <button 
                    onClick={() => router.push('/checkout')} 
                    className="w-full py-2.5 bg-rose text-white text-[9px] uppercase font-medium tracking-[0.2em] hover:bg-ink transition-colors text-center shadow-md shadow-rose/20"
                  >
                    Secure Checkout
                  </button>
                </div>
              )}

              {/* Trust Badges - Desktop only (Hidden if Cart is active to save space) */}
              {!isMobile && items.length === 0 && (
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-ink/5">
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
                <h2 className="text-4xl md:text-6xl font-display font-medium italic tracking-tighter text-ink uppercase">Related <span className="text-rose">Products</span></h2>
              </div>
              <Link href="/shop" className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/30 hover:text-rose transition-colors flex items-center gap-2 group mb-2 md:mb-0">
                View Full Collection <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-10">
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
                      {p.price_tag && (
                        <div className="text-[8px] font-medium uppercase tracking-[0.2em] text-rose mb-0.5">
                          {p.price_tag}
                        </div>
                      )}
                      <p className="text-xs font-medium text-rose">IDR {p.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
