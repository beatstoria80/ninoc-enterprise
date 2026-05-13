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
      <section className="relative md:pt-44 pt-20 pb-20 px-6 md:px-12 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: Branding & Logic */}
          <div className="lg:col-span-4 space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 text-rose">
                 <Paperclip size={18} />
                 <span className="text-[10px] font-medium uppercase tracking-[0.5em]">Origin Specification</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-display font-medium italic tracking-tighter text-ink leading-[0.85] uppercase">
                Archival<br/>Apparel
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs md:text-sm font-medium leading-relaxed text-ink/60 max-w-sm uppercase tracking-wider"
            >
              Established for the preservation of garment integrity.
              Our collection represents a curated selection of
              technical excellence and timeless design.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/shop" className="group inline-flex items-center gap-6 text-ink hover:text-rose transition-all">
                <span className="text-[11px] font-medium uppercase tracking-[0.4em]">Browse Catalog</span>
                <div className="w-12 h-[1px] bg-ink/20 group-hover:w-20 group-hover:bg-rose transition-all" />
              </Link>
            </motion.div>
          </div>

          {/* Middle Column: Visual Anchor */}
          <div className="lg:col-span-5 relative">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1.2 }}
               className="aspect-[4/5] bg-white rounded-none overflow-hidden border border-ink/5 relative shadow-2xl shadow-ink/5"
             >
                <Image
                   src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                   alt="Archival Garment"
                   fill
                   className="object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cr/20 to-transparent" />
             </motion.div>

             {/* Technical Callout Overlay */}
             <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-none border border-ink/5 shadow-xl hidden md:block">
                <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30 mb-2">Technical Detail</p>
                <p className="text-[10px] font-medium text-ink uppercase">Hand-stitched precision<br/>Industrial Grade Fabrics</p>
             </div>
          </div>

          {/* Right Column: Metadata & Trust */}
          <div className="lg:col-span-3 space-y-16 lg:pt-32">
             <div className="space-y-6 border-l border-ink/5 pl-8">
                <div className="space-y-1">
                   <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Year</p>
                   <p className="text-xs font-medium text-ink">Est. 2024</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Location</p>
                   <p className="text-xs font-medium text-ink">Bandung, Indonesia</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-medium uppercase tracking-widest text-ink/20">Philosophy</p>
                   <p className="text-xs font-medium text-ink italic leading-relaxed">&quot;Functionality through absolute simplicity.&quot;</p>
                </div>
             </div>

             <div className="bg-ink text-white p-8 rounded-none space-y-6">
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
      </section>

      {/* SWISS GRID CATALOG SECTION */}
      <section className="mt-40 px-6 md:px-12 max-w-[1800px] mx-auto">
        <div className="flex items-end justify-between border-b border-ink/5 pb-8 mb-12">
           <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-ink/20 mb-3">Latest Archive</p>
              <h2 className="text-4xl font-display font-medium italic tracking-tighter uppercase text-ink">New Releases</h2>
           </div>
           <Link href="/shop" className="text-[10px] font-medium uppercase tracking-widest text-ink hover:text-rose transition-all">View All</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-ink/5 border border-ink/5 overflow-hidden rounded-none">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white animate-pulse" />
            ))
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="bg-white p-4 md:p-8 group relative overflow-hidden transition-all duration-700"
              >
                <div className="aspect-[3/4] overflow-hidden mb-6 md:mb-8">
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <p className="text-[8px] md:text-[9px] font-medium uppercase tracking-widest text-ink/30">{product.category}</p>
                  <h3 className="text-sm md:text-xl font-display font-medium italic uppercase tracking-tight group-hover:text-rose transition-colors line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-ink/5 mt-3 md:mt-4">
                     <p className="text-sm md:text-lg font-display font-medium italic text-ink">Rp {product.price.toLocaleString('id-ID')}</p>
                     <div className="w-6 h-6 md:w-8 md:h-8 rounded-none bg-ink/5 flex items-center justify-center group-hover:bg-rose group-hover:text-white transition-all">
                        <ChevronRight size={12} />
                     </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* TRUST SYMBOLS SECTION */}
      <section className="mt-40 mb-40 border-y border-ink/5 py-24 bg-white/30 backdrop-blur-sm">
         <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-20">
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-16 h-16 bg-ink/5 rounded-none flex items-center justify-center text-rose">
                  <ShieldCheck size={28} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.3em]">Quality Assured</h3>
                  <p className="text-[8px] font-medium uppercase tracking-widest text-ink/30 leading-relaxed">Rigorous inspection for every piece.</p>
               </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-16 h-16 bg-ink/5 rounded-none flex items-center justify-center text-rose">
                  <Zap size={28} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.3em]">Instant Logistics</h3>
                  <p className="text-[8px] font-medium uppercase tracking-widest text-ink/30 leading-relaxed">Rapid archival fulfillment system.</p>
               </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-16 h-16 bg-ink/5 rounded-none flex items-center justify-center text-rose">
                  <Package size={28} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.3em]">Secure Storage</h3>
                  <p className="text-[8px] font-medium uppercase tracking-widest text-ink/30 leading-relaxed">Protected preservation environment.</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}