"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Zap, Package, Paperclip, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// Portrait image carousel pool for hover effect
const PORTRAIT_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop",
];

const CAROUSEL_INTERVAL = 200; // ms per image switch

function PortraitImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCycle = useCallback(() => {
    setIsHovered(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    setCurrentIndex(0);
  }, []);

  const startCycle = useCallback(() => {
    setIsHovered(true);
    let idx = 0;
    setCurrentIndex(idx);

    // Auto-stop after 2 cycles (~2 seconds) to prevent infinite loop on mobile/touch
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      stopCycle();
    }, 2000);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      idx = (idx + 1) % PORTRAIT_IMAGES.length;
      setCurrentIndex(idx);
    }, CAROUSEL_INTERVAL);
  }, [stopCycle]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="aspect-[3/4] md:aspect-[4/5] bg-white overflow-hidden border border-ink/5 relative shadow-2xl shadow-ink/5"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
      style={{ cursor: 'pointer' }}
    >
      {PORTRAIT_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-100"
          style={{
            opacity: currentIndex === i && isHovered ? 1 : (currentIndex === i && !isHovered ? 1 : 0),
            zIndex: currentIndex === i ? 2 : 1,
          }}
        >
          <Image
            src={src}
            alt={`Archival Garment ${i + 1}`}
            fill
            className={`object-cover ${isHovered ? 'grayscale-0' : 'grayscale'}`}
            priority={i === 0}
          />
        </div>
      ))}

      {/* Grayscale base when not hovered */}
      {!isHovered && (
        <div
          className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-1000 z-10 pointer-events-none"
          aria-hidden="true"
        >
          <Image
            src={PORTRAIT_IMAGES[0]}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Cycling indicator dots */}
      {isHovered && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {PORTRAIT_IMAGES.map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full transition-all duration-100"
              style={{
                backgroundColor: currentIndex === i ? '#E8527A' : 'rgba(20,20,20,0.2)',
              }}
            />
          ))}
        </div>
      )}

      <div className="absolute top-1 left-1 bg-ink text-white px-1 py-0.5 text-[6px] uppercase font-mono tracking-tighter md:hidden">
        SPEC-001
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-cr/20 to-transparent hidden md:block" />
    </motion.div>
  );
}

// Fade-up section wrapper for entrance animations
function FadeUpSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  slug: string;
  category?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(4);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="mobile-momentum overflow-x-hidden">
      {/*
        ---------------------------------------------------------
        ARCHIVAL STUDIO HERO SECTION
        Refined, Asymmetric, Minimalist
        ---------------------------------------------------------
      */}
      {/* HERO SECTION - TECHNICAL SPLIT LAYOUT */}
      <FadeUpSection delay={0}>
      <section className="relative md:pt-44 pt-2 pb-6 px-4 md:px-12 max-w-[1800px] mx-auto border-b border-ink/5">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center lg:items-start">

          {/* Left Column: Branding */}
          <div className="lg:col-span-4 space-y-3 md:space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="space-y-1 md:space-y-4"
            >
              <div className="flex items-center gap-2 text-rose">
                 <Paperclip className="w-3 h-3 md:w-[18px] md:h-[18px]" />
                 <span className="text-[7px] md:text-[10px] font-medium uppercase tracking-[0.3em]">Origin Specification</span>
              </div>
              <h1 className="text-3xl md:text-8xl font-display font-medium italic tracking-tighter text-ink leading-[0.75] uppercase">
                Archival<br/>Apparel
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[8px] md:text-sm font-medium leading-tight md:leading-relaxed text-ink/80 md:text-ink/60 max-w-[120px] md:max-w-sm uppercase tracking-tight md:tracking-wider"
            >
              Established for the preservation of garment integrity.
              <span className="hidden md:inline"> Our collection represents a curated selection of technical excellence and timeless design.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/shop" className="group inline-flex items-center gap-2 md:gap-6 text-ink hover:text-rose transition-all">
                <span className="text-[7px] md:text-[11px] font-medium uppercase tracking-[0.2em] md:tracking-[0.4em]">Browse Catalog</span>
                <div className="w-4 md:w-12 h-[1px] bg-ink/40 md:bg-ink/20 group-hover:w-20 group-hover:bg-rose transition-all" />
              </Link>
            </motion.div>
          </div>

          {/* Right Column (Mobile) / Middle (PC): Visual Anchor */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
             <PortraitImageCarousel />

             {/* Technical Callout Overlay (PC Only) */}
             <motion.div
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1.4, duration: 0.6 }}
               className="absolute -bottom-8 -right-8 bg-white p-6 rounded-none border border-ink/5 shadow-xl hidden md:block"
             >
                <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30 mb-2">Technical Detail</p>
                <p className="text-[10px] font-medium text-ink uppercase">Hand-stitched precision<br/>Industrial Grade Fabrics</p>
             </motion.div>
          </div>

          {/* Metadata Block - Compact Row for Mobile / Classic Sidebar for PC */}
          <div className="col-span-2 lg:col-span-3 lg:pt-72 mt-4 lg:mt-0">
             {/* MOBILE VIEW GRID */}
             <div className="grid grid-cols-3 gap-2 border-t border-ink/5 pt-3 md:hidden">
                <div className="space-y-0">
                   <p className="text-[7px] font-medium uppercase tracking-widest text-ink/40">Year</p>
                   <p className="text-[9px] font-medium text-ink uppercase">2024</p>
                </div>
                <div className="space-y-0">
                   <p className="text-[7px] font-medium uppercase tracking-widest text-ink/40">Loc</p>
                   <p className="text-[9px] font-medium text-ink uppercase">BDG, ID</p>
                </div>
                <div className="space-y-0">
                   <p className="text-[7px] font-medium uppercase tracking-widest text-ink/40">Phil</p>
                   <p className="text-[9px] font-medium text-ink uppercase italic leading-none">Simplicity</p>
                </div>
             </div>

             {/* DESKTOP VIEW SIDEBAR */}
             <div className="hidden md:flex flex-col space-y-3 border-l border-ink/5 pl-8">
                <div className="space-y-0">
                   <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20">Year</p>
                   <p className="text-[10px] font-medium text-ink">Est. 2024</p>
                </div>
                <div className="space-y-0">
                   <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20">Location</p>
                   <p className="text-[10px] font-medium text-ink">Bandung, Indonesia</p>
                </div>
                <div className="space-y-0">
                   <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20">Philosophy</p>
                   <p className="text-[10px] font-medium text-ink italic leading-tight">&quot;Functionality through absolute simplicity.&quot;</p>
                </div>

                <div className="bg-ink text-white p-8 rounded-none space-y-6 hidden lg:block mt-8">
                   <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="text-rose" />
                      <span className="text-[10px] font-medium uppercase tracking-widest">Global Integrity</span>
                   </div>
                   <p className="text-[9px] font-medium uppercase leading-relaxed tracking-wider opacity-60">
                      Secure fulfillment and international verification protocols for every archive piece.
                   </p>
                </div>
             </div>
          </div>

        </div>
      </section>
      </FadeUpSection>

      {/* SWISS GRID CATALOG - DENSE GRID (MOBILE) / CLASSIC GRID (PC) */}
      <FadeUpSection delay={0.1}>
      <section className="md:mt-40 mt-4 px-4 md:px-12 max-w-[1800px] mx-auto">
        <div className="flex items-end justify-between border-b border-ink/5 pb-2 md:pb-8 mb-4 md:mb-12">
           <div>
              <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.5em] text-ink/40 md:text-ink/20 mb-1 md:mb-3">Latest Archive</p>
              <h2 className="text-xl md:text-4xl font-display font-medium italic tracking-tighter uppercase text-ink">New Releases</h2>
           </div>
           <Link href="/shop" className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest text-ink hover:text-rose transition-all">View All</Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink/5 border border-ink/5 overflow-hidden rounded-none">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white animate-pulse" />
            ))
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="bg-white p-3 md:p-8 group relative overflow-hidden transition-all duration-700"
              >
                <div className="aspect-[3/4] overflow-hidden mb-2 md:mb-8 relative">
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                </div>
                <div className="space-y-1 md:space-y-3">
                  <p className="text-[7px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 md:text-ink/20">{product.category}</p>
                  <h3 className="text-[9px] md:text-xl font-display font-medium italic uppercase tracking-tight group-hover:text-rose transition-colors line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between pt-2 md:pt-6 border-t border-ink/5 mt-2 md:mt-6">
                     <p className="text-[9px] md:text-lg font-display font-medium italic text-ink">Rp {product.price.toLocaleString('id-ID')}</p>
                     <div className="w-5 h-5 md:w-10 md:h-10 rounded-none bg-ink/5 flex items-center justify-center group-hover:bg-rose group-hover:text-white transition-all">
                        <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                     </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
      </FadeUpSection>

      {/* TRUST SYMBOLS - HIGH DENSITY (MOBILE) / SPACIOUS (PC) */}
      <FadeUpSection delay={0.2}>
      <section className="md:mt-40 mt-8 md:mb-40 mb-12 border-y border-ink/5 py-4 md:py-24 bg-white/30 backdrop-blur-sm">
         <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-20">
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-6">
               <div className="w-8 h-8 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose">
                  <ShieldCheck className="w-4 h-4 md:w-7 md:h-7" />
               </div>
               <div className="space-y-0 md:space-y-2">
                  <h3 className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest leading-none">Quality Assured</h3>
                  <p className="text-[6px] md:text-[8px] font-medium uppercase tracking-tighter md:tracking-widest text-ink/60 md:text-ink/30 leading-relaxed">Rigorous inspection.</p>
               </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-6">
               <div className="w-8 h-8 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose">
                  <Zap className="w-4 h-4 md:w-7 md:h-7" />
               </div>
               <div className="space-y-0 md:space-y-2">
                  <h3 className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest leading-none">Instant Logistics</h3>
                  <p className="text-[6px] md:text-[8px] font-medium uppercase tracking-tighter md:tracking-widest text-ink/60 md:text-ink/30 leading-relaxed">Rapid fulfillment.</p>
               </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-6">
               <div className="w-8 h-8 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose">
                  <Package className="w-4 h-4 md:w-7 md:h-7" />
               </div>
               <div className="space-y-0 md:space-y-2">
                  <h3 className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest leading-none">Secure Storage</h3>
                  <p className="text-[6px] md:text-[8px] font-medium uppercase tracking-tighter md:tracking-widest text-ink/60 md:text-ink/30 leading-relaxed">Protected storage.</p>
               </div>
            </div>
         </div>
      </section>
      </FadeUpSection>
    </div>
  );
}