"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, User, Menu, Star, ArrowRight, ChevronRight, ShoppingBag, ShieldCheck, Zap, Package } from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Components
const HeroBackgroundText = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-20">
    <div className="absolute top-[10%] -left-10 text-[18vw] font-display font-black text-ink italic -rotate-12 whitespace-nowrap tracking-tighter opacity-5">
      NINOC
    </div>
    <div className="absolute bottom-[5%] -right-20 text-[14vw] font-display font-black text-rose rotate-6 whitespace-nowrap tracking-tighter opacity-5">
      PURE ORGANIC
    </div>
  </div>
);

const Blobs = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute top-[-5%] left-[-5%] w-[30vw] h-[30vw] bg-rose/5 rounded-full blur-[100px]" />
    <div className="absolute bottom-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-lav/10 rounded-full blur-[100px]" />
  </div>
);

const ProductCard = ({ name, price, bg, i }: { name: string, price: string, bg: string, i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 * i }}
    whileHover={{ y: -10, transition: { duration: 0.3 } }}
    className="group relative bg-white rounded-[2rem] p-4 border border-black/5 shadow-editorial overflow-hidden"
  >
    <div className={cn("w-full aspect-[4/5] rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105", bg)}>
      <ShoppingBag size={60} className="text-ink/10" />
    </div>
    <div className="px-2">
      <h3 className="label-caps text-ink mb-1">{name}</h3>
      <p className="text-sm font-black text-rose">{price}</p>
    </div>
  </motion.div>
);

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Fetch products from Supabase
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen bg-cr noise selection:bg-rose/20">
      <Blobs />
      <HeroBackgroundText />

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-[100] px-6 py-4 flex items-center justify-between transition-all duration-500",
        isScrolled ? "glass border-b border-ink/5" : "bg-transparent"
      )}>
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-ink/5 rounded-full transition-colors"
            >
              <Menu size={18} className="text-ink" />
            </motion.button>
            <Link href="/" className="cursor-pointer group">
              <div className="font-display font-black text-2xl italic tracking-tighter text-rose leading-none">NINOC</div>
              <div className="text-[7px] font-black tracking-[0.5em] text-ink/20 -mt-0.5 ml-0.5 uppercase">Atelier Archive</div>
            </Link>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            {['Atelier', 'Collections', 'Sustainability', 'About'].map((item) => (
              <Link 
                key={item} 
                href={item === 'Atelier' ? '/shop' : '#'}
                className="relative group"
              >
                <motion.span 
                  whileHover={{ y: -2 }}
                  className="nav-link text-ink/40 group-hover:text-rose block"
                >
                  {item}
                </motion.span>
                <motion.span 
                  className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-rose group-hover:w-full transition-all duration-300" 
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            className="hidden sm:flex items-center gap-2 p-2 px-4 rounded-full hover:bg-ink/5 transition-colors text-[10px] font-black uppercase tracking-widest text-ink/60"
          >
            <Search size={14} />
            <span>Search</span>
          </motion.button>
          <div className="h-6 w-[1px] bg-ink/10 hidden sm:block" />
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-2 bg-ink text-white rounded-full shadow-xl shadow-ink/20 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-rose to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShoppingCart size={16} className="relative z-10" />
          </motion.button>
          <Link href="/admin">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 border border-ink/10 rounded-full hover:bg-ink hover:text-white transition-all cursor-pointer"
            >
              <User size={16} />
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 min-h-[90vh]">
        <div className="flex-1 space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-rose/5 border border-rose/10 rounded-full"
          >
            <Star size={10} className="text-rose fill-rose" />
            <span className="label-caps text-rose">New Arrival 2026</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[12vw] sm:text-[9vw] lg:text-[8vw] font-display font-black italic text-ink leading-[0.9] tracking-tighter"
          >
            Wear the <span className="text-rose">Art,</span> <br />
            Own the Day.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-lg text-sm text-muted-text leading-relaxed font-medium"
          >
            Hadirkan sentuhan seni dalam gaya harian melalui koleksi kaos artistik untuk seluruh keluarga. Lengkapi penampilan Anda dengan aksesoris pilihan dan perlengkapan harian fungsional yang didesain khusus untuk mobilitas tinggi.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <Link href="/shop" className="group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-ink text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl shadow-ink/20 overflow-hidden relative cursor-pointer"
              >
                <span className="relative z-10">Explore Atelier</span>
                <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-rose to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-ink/10 rounded-full font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-ink hover:text-white transition-all"
            >
              Watch Film
            </motion.button>
          </motion.div>
        </div>

        <div className="flex-1 relative w-full aspect-square max-w-[500px]">
          <div className="grid grid-cols-2 gap-4 p-4 perspective-grid">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-white/10 rounded-[2rem] aspect-[4/5]" />
              ))
            ) : products.length > 0 ? (
              products.map((p, i) => (
                <ProductCard 
                  key={p.id}
                  name={p.name} 
                  price={`Rp ${p.price.toLocaleString('id-ID')}`} 
                  bg={p.category === 'pakaian' ? 'bg-mnt/40' : 'bg-lav/40'} 
                  i={i} 
                />
              ))
            ) : (
              <div className="col-span-2 text-center text-ink/20 py-20 italic">No collections found.</div>
            )}
          </div>
          
          {/* Floating Element */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 glass p-6 rounded-3xl shadow-2xl border border-white/40 hidden md:block"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center">
                <ShieldCheck className="text-rose" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-ink uppercase tracking-widest leading-none">Certified</p>
                <p className="text-[8px] font-bold text-muted-text uppercase tracking-widest mt-1">Organic Quality</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={8} className="text-rose fill-rose" />)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="bg-ink py-20 px-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-rose)_0%,_transparent_70%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-20">
          {[
            { icon: <Zap size={24} />, title: "Express Delivery", desc: "Arrives at your doorstep in 24-48 hours with premium packaging." },
            { icon: <ShieldCheck size={24} />, title: "Secure Checkout", desc: "PCI-DSS compliant payments with encrypted transaction layers." },
            { icon: <Package size={24} />, title: "Sustainable Fabric", desc: "100% organic cotton and eco-certified Indonesian silk." }
          ].map((f, i) => (
            <motion.div 
              key={i}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-rose border border-white/10">
                {f.icon}
              </div>
              <h3 className="text-white font-display italic text-xl">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-6 text-center space-y-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-ink/10 to-transparent" />
        
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-5xl md:text-7xl font-display font-black italic tracking-tighter text-ink leading-tight">
            Ready to <span className="text-rose">Transform</span> Your Wardrobe?
          </h2>
          <p className="text-muted-text text-sm md:text-base font-medium">
            Join 10,000+ conscious individuals wearing NINOC. Limited collections released monthly.
          </p>
        </div>

        <button className="group px-12 py-6 bg-ink text-white rounded-full font-black text-xs uppercase tracking-[0.4em] inline-flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-ink/30 relative overflow-hidden">
          <span className="relative z-10">Start Your Journey</span>
          <ChevronRight size={18} className="relative z-10 group-hover:translate-x-2 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-rose to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </section>

      {/* Footer - Minimalist One-liner for 2026 Style */}
      <footer className="py-8 px-6 bg-white relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 border-t border-ink/5 pt-8">
          <div className="flex items-center gap-4">
            <div className="font-display font-black text-lg italic tracking-tighter text-rose leading-none">NINOC</div>
            <span className="h-4 w-[1px] bg-ink/10" />
            <p className="text-[8px] text-muted-text font-black uppercase tracking-[0.4em]">Pure Organic Atelier 2026</p>
          </div>
          
          <div className="flex items-center gap-6">
            {['Instagram', 'Archive', 'Legal'].map((item) => (
              <motion.a 
                key={item} 
                whileHover={{ y: -1, opacity: 1 }}
                href="#" 
                className="text-[8px] font-black uppercase tracking-[0.3em] text-ink/30 hover:text-rose transition-all"
              >
                {item}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
