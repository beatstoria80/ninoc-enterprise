"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, ShieldCheck, Heart, Share2, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://esiapizmdpylhotojfij.supabase.co/rest/v1/products?slug=eq.${slug}&select=*,variants(*)`, {
          headers: {
            'apikey': 'sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK',
            'Authorization': 'Bearer sb_publishable_zmEN-lHjvnye1yzU07rqqg_I9XqctMK'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProduct(data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (isLoading) return <div className="min-h-screen bg-cr flex items-center justify-center font-black uppercase tracking-widest text-ink/20">Loading Atelier Archive...</div>;
  if (!product) return <div className="min-h-screen bg-cr flex items-center justify-center font-black uppercase tracking-widest text-ink/20">Product Not Found.</div>;

  return (
    <main className="min-h-screen bg-cr noise pb-20">
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-8 flex items-center justify-between glass border-b border-ink/5">
        <Link href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-ink transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Collection</span>
        </Link>
        <div className="font-display font-black text-2xl italic tracking-tighter text-rose">NINOC</div>
        <button className="p-2 border border-ink/10 rounded-full hover:bg-ink hover:text-white transition-all">
          <Share2 size={16} />
        </button>
      </nav>

      <div className="pt-40 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-[4/5] bg-ink/5 rounded-[3rem] overflow-hidden group shadow-editorial"
        >
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
        </motion.div>

        {/* Product Info */}
        <div className="space-y-12 py-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="label-caps text-rose bg-rose/5 px-3 py-1 rounded-full">{product.category}</span>
              <span className="h-4 w-[1px] bg-ink/10" />
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-rose fill-rose" />)}
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black italic tracking-tighter text-ink leading-none">{product.name}</h1>
            <p className="text-3xl font-display font-black italic text-rose">Rp {product.price.toLocaleString('id-ID')}</p>
          </div>

          <div className="space-y-6">
            <h4 className="label-caps">Description</h4>
            <p className="text-sm leading-relaxed max-w-lg">{product.description || 'Elevate your daily mobility with this masterfully crafted piece from NINOC Atelier.'}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between max-w-xs">
              <h4 className="label-caps">Select Size</h4>
              <button className="text-[9px] font-black uppercase text-rose underline tracking-widest">Size Guide</button>
            </div>
            <div className="flex gap-4">
              {['S', 'M', 'L', 'XL'].map(size => (
                <button 
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "w-14 h-14 rounded-2xl border text-xs font-black transition-all duration-300",
                    selectedSize === size ? "bg-ink text-white shadow-xl shadow-ink/20" : "border-ink/10 text-ink/40 hover:border-ink"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-8">
            <button 
              onClick={() => {
                addItem(product, selectedSize);
                alert('Added to cart!');
              }}
              className="flex-1 bg-ink text-white py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-ink/30 group relative overflow-hidden"
            >
              <span className="relative z-10">Add to Atelier Cart</span>
              <ShoppingBag size={18} className="relative z-10 group-hover:rotate-12 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-rose to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button className="p-6 border border-ink/10 rounded-full hover:bg-rose/10 hover:text-rose transition-all">
              <Heart size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-12 border-t border-ink/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center text-rose">
                <ShieldCheck size={20} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest leading-tight text-ink/60">Verified <br />Quality</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center text-rose">
                <ShoppingBag size={20} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest leading-tight text-ink/60">Eco-Friendly <br />Shipping</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
