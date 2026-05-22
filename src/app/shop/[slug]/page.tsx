"use client";

import React, { useState, useEffect } from 'react';

import { ArrowLeft, Star, ShieldCheck, RefreshCw, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
  const { addItem, removeItem, items, totalPrice } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

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

        {/* ARTBOARD 2 LAYOUT: Unified Responsive Architecture */}
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
          <div className="flex justify-center items-stretch gap-2 h-[45vh] lg:h-[60vh]">
            {/* Left Photo Perspective */}
            <button 
              onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="w-1/4 relative bg-white border border-ink transition-all hover:bg-ink/[0.02] active:scale-[0.98] group flex-shrink-0"
            >
               <Image src={images[(activeImageIndex - 1 + images.length) % images.length]} fill alt="Perspective Left" className="object-contain p-2 md:p-4" />
               <div className="absolute top-2 left-2 px-1 border border-ink/10 text-[5px] md:text-[7px] font-medium uppercase tracking-widest text-ink/40 bg-white/50 backdrop-blur-sm hidden md:block">PERSPECTIVE</div>
            </button>
            
            {/* Center Photo Utama */}
            <div className="w-2/4 relative bg-white border border-ink shadow-sm z-10">
               <Image src={images[activeImageIndex]} fill alt={product.name} className="object-contain p-2 md:p-6" priority />
               <div className="absolute top-2 left-2 px-1.5 py-0.5 border border-ink text-[6px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink bg-white">UTAMA</div>
               
               {/* Controls */}
               <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                 {images.map((_, i) => (
                    <div key={i} className={cn("h-1 rounded-none transition-all", activeImageIndex === i ? "w-4 md:w-6 bg-ink" : "w-1.5 md:w-2 bg-ink/20")} />
                 ))}
               </div>
            </div>

            {/* Right Photo Perspective */}
            <button 
              onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="w-1/4 relative bg-white border border-ink transition-all hover:bg-ink/[0.02] active:scale-[0.98] group flex-shrink-0"
            >
               <Image src={images[(activeImageIndex + 1) % images.length]} fill alt="Perspective Right" className="object-contain p-2 md:p-4" />
               <div className="absolute top-2 right-2 px-1 border border-ink/10 text-[5px] md:text-[7px] font-medium uppercase tracking-widest text-ink/40 bg-white/50 backdrop-blur-sm hidden md:block">PERSPECTIVE</div>
            </button>
          </div>

          {/* MIDDLE CONTENT BLOCKS (BOX GRID) */}
          <div className="flex flex-col gap-2 pt-2">
            
            {/* Row 1: Title/Price & Size Grid */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 bg-white border border-ink p-3 md:p-4 flex flex-col justify-center">
                 <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-medium italic tracking-tighter uppercase leading-[0.9] text-ink">{product.name}</h1>
                 <div className="flex items-center gap-3 mt-1.5 md:mt-2">
                   <p className="text-sm md:text-lg font-medium text-rose tracking-tight">IDR {product.price?.toLocaleString('id-ID')}</p>
                   {product.price_tag && <span className="text-[6px] md:text-[7px] border border-rose/30 bg-rose/5 text-rose uppercase tracking-[0.2em] px-1 py-0.5">{product.price_tag}</span>}
                 </div>
              </div>
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "flex-1 w-12 md:w-16 min-h-[50px] border flex items-center justify-center text-xs font-bold transition-all",
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
                <h4 className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.3em] text-ink">Origin Specification</h4>
              </div>
              <div className="w-[104px] md:w-[136px] bg-white border border-ink flex items-center justify-between px-2 flex-shrink-0">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 flex items-center justify-center hover:text-rose"><Minus size={10}/></button>
                <span className="text-[10px] font-medium text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 flex items-center justify-center hover:text-rose"><Plus size={10}/></button>
              </div>
            </div>

            {/* Row 3: Description Box */}
            <div className="bg-white border border-ink p-4 md:p-6 min-h-[120px]">
              <p className="text-[10px] md:text-xs leading-relaxed text-ink/80 font-medium">{product.description || 'Premium aesthetic collection from NINOC Archive.'}</p>
              
              <div className="flex items-center gap-1.5 mt-4">
                <span className="px-1.5 py-0.5 bg-ink text-white text-[5px] md:text-[6px] font-medium uppercase tracking-[0.2em]">Authentic</span>
                <div className="flex gap-0.5 text-rose/40"><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /><Star size={6} fill="currentColor" /></div>
              </div>
            </div>

            {/* Row 4: Measurement Header */}
            <div className="bg-white border border-ink p-2 px-4 flex items-center">
              <h4 className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.3em] text-ink">Measurement & Archive</h4>
            </div>

            {/* Row 5: Large Box (Measurement & Cart) */}
            <div className="bg-white border border-ink p-4 md:p-6 flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Left: Measurement */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[7px] md:text-[8px] font-bold border-b border-ink/20 pb-1.5"><span className="text-ink/50 uppercase tracking-widest">Size</span><span className="text-ink/50 uppercase tracking-widest">Chest / Length</span></div>
                {['S: 94 / 68', 'M: 100 / 70', 'L: 106 / 72', 'XL: 112 / 74'].map(s => (
                  <div key={s} className="flex justify-between text-[8px] md:text-[10px] font-medium border-b border-ink/5 pb-1.5 mt-1.5">
                    <span className="text-rose font-bold">{s.split(':')[0]}</span>
                    <span>{s.split(':')[1]}</span>
                  </div>
                ))}
                <p className="text-[6px] md:text-[7px] text-ink/30 mt-3 uppercase font-medium italic">* Model wearing Size M (175cm / 65kg)</p>
              </div>
              
              {/* Right: Cart Summary Box */}
              <div className="flex-1 md:border-l border-ink/10 md:pl-8 flex flex-col pt-4 md:pt-0 border-t md:border-t-0">
                <div className="flex justify-between items-center mb-3">
                   <h4 className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-1.5"><ShoppingCart size={10} className="text-rose"/> Cart Summary</h4>
                   <span className="text-[8px] md:text-[9px] font-medium bg-ink/5 px-1.5 py-0.5">{items.length} Items</span>
                </div>
                
                {/* Mini cart items preview */}
                <div className="flex-1 overflow-y-auto minimal-scroll pr-1 max-h-[120px] mb-3 space-y-2">
                  {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[8px] uppercase tracking-widest text-ink/30 font-medium">Archive Empty</div>
                  ) : (
                    items.map(item => (
                      <div key={`${item.id}-${item.size}`} className="flex justify-between items-center text-[8px] md:text-[9px] font-medium bg-ink/[0.02] p-1.5 border border-ink/5">
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
                  <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-ink/50">Total</span>
                  <span className="text-xs md:text-sm font-bold text-rose">IDR {totalPrice().toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={cn(
                "w-full py-4 md:py-5 mt-2 border-2 text-[10px] md:text-[12px] uppercase font-bold tracking-[0.4em] transition-all flex items-center justify-center gap-2",
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

    </main>
  );
}
