"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://esiapizmdpylhotojfij.supabase.co/rest/v1/products?select=*', {
          headers: {
            'apikey': 'sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK',
            'Authorization': 'Bearer sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-cr noise relative overflow-hidden">
      {/* Simple Header */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-8 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/" className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Home</span>
        </Link>
        <div className="font-display font-black text-2xl italic tracking-tighter text-rose">SHOP</div>
        <div className="w-20" /> {/* Spacer */}
      </nav>

      <div className="pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="space-y-2">
            <h1 className="label-caps !text-ink !text-lg tracking-[0.6em]">The Collection</h1>
            <p className="text-[10px] font-black text-ink/30 uppercase tracking-[0.4em]">Curated artistic pieces for your daily mobility</p>
          </div>
          
          <div className="flex items-center gap-4">
            {['All', 'Fashion', 'Accessories', 'Utilities'].map(cat => (
              <button key={cat} className="px-6 py-3 rounded-full border border-ink/10 text-[9px] font-black uppercase tracking-widest hover:bg-ink hover:text-white transition-all">
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-[2.5rem] border border-ink/5 aspect-[4/5]" />
            ))
          ) : products.map((p, i) => (
            <Link key={p.id} href={`/shop/${p.slug}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white p-4 rounded-[2.5rem] border border-ink/5 shadow-dashboard hover:shadow-xl transition-all cursor-pointer h-full"
              >
                <div className="w-full aspect-[4/5] bg-ink/5 rounded-[2rem] overflow-hidden relative mb-6">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-ink">
                    {p.category}
                  </div>
                </div>
                
                <div className="px-2 space-y-2">
                  <h3 className="label-caps !text-ink !tracking-widest">{p.name}</h3>
                  <p className="text-[10px] text-muted-text line-clamp-1">{p.description}</p>
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-lg font-display font-black italic text-rose">Rp {p.price.toLocaleString('id-ID')}</p>
                    <div className="p-3 bg-ink text-white rounded-full group-hover:scale-110 transition-all shadow-lg shadow-ink/20">
                      <ShoppingBag size={16} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
