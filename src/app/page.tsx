"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Package, Paperclip, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

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
      <section className="relative md:pt-44 pt-2 pb-6 px-4 md:px-12 max-w-[1800px] mx-auto border-b border-ink/5">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center lg:items-start">

          {/* Left Column: Branding */}
          <div className="lg:col-span-4 space-y-3 md:space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
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
              className="text-[8px] md:text-sm font-medium leading-tight text-ink/80 max-w-[120px] md:max-w-xs uppercase tracking-tight"
            >
              Preservation of garment integrity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/shop" className="group inline-flex items-center gap-2 md:gap-6 text-ink hover:text-rose transition-all">
                <span className="text-[7px] md:text-[11px] font-medium uppercase tracking-[0.2em]">Browse</span>
                <div className="w-4 md:w-12 h-[1px] bg-ink/40 group-hover:w-20 group-hover:bg-rose transition-all" />
              </Link>
            </motion.div>
          </div>

          {/* Right Column (Mobile) / Middle (PC): Visual Spec */}
          <div className="lg:col-span-5 relative">
             <motion.div
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1.2 }}
               className="aspect-[3/4] md:aspect-[4/5] bg-white rounded-none overflow-hidden border border-ink/5 relative"
             >
                <Image
                   src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                   alt="Archival Garment"
                   fill
                   className="object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute top-1 left-1 bg-ink text-white px-1 py-0.5 text-[6px] uppercase font-mono tracking-tighter">
                   SPEC-001
                </div>
             </motion.div>
          </div>

          {/* Metadata Block - Now integrated below on mobile for density */}
          <div className="col-span-2 lg:col-span-3 lg:pt-32">
             <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 border-t border-ink/5 pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
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
          </div>

        </div>
      </section>

      {/* SWISS GRID CATALOG - DENSE GRID */}
      <section className="md:mt-24 mt-4 px-4 md:px-12 max-w-[1800px] mx-auto">
        <div className="flex items-end justify-between border-b border-ink/5 pb-2 mb-4">
           <h2 className="text-xl md:text-4xl font-display font-medium italic tracking-tighter uppercase text-ink">New Releases</h2>
           <Link href="/shop" className="text-[8px] font-medium uppercase tracking-widest text-ink hover:text-rose transition-all">All</Link>
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
                  <p className="text-[7px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">{product.category}</p>
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

      {/* TRUST SYMBOLS - HIGH DENSITY GRID */}
      <section className="md:mt-24 mt-4 md:mb-40 mb-12 border-y border-ink/5 py-4 md:py-24 bg-white/30 backdrop-blur-sm">
         <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-3 gap-4 md:gap-20">
            <div className="flex flex-col items-center text-center space-y-2">
               <div className="w-8 h-8 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose">
                  <ShieldCheck className="w-4 h-4 md:w-7 md:h-7" />
               </div>
               <div className="space-y-0">
                  <h3 className="text-[8px] font-medium uppercase tracking-widest leading-none">Quality</h3>
                  <p className="text-[6px] font-medium uppercase tracking-tighter text-ink/60 hidden md:block">Rigorous inspection.</p>
               </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
               <div className="w-8 h-8 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose">
                  <Zap className="w-4 h-4 md:w-7 md:h-7" />
               </div>
               <div className="space-y-0">
                  <h3 className="text-[8px] font-medium uppercase tracking-widest leading-none">Instant</h3>
                  <p className="text-[6px] font-medium uppercase tracking-tighter text-ink/60 hidden md:block">Rapid fulfillment.</p>
               </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
               <div className="w-8 h-8 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose">
                  <Package className="w-4 h-4 md:w-7 md:h-7" />
               </div>
               <div className="space-y-0">
                  <h3 className="text-[8px] font-medium uppercase tracking-widest leading-none">Secure</h3>
                  <p className="text-[6px] font-medium uppercase tracking-tighter text-ink/60 hidden md:block">Protected storage.</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}