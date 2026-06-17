"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence, Variants } from 'framer-motion';
import { Grid3X3, ChevronRight, ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { CategoryType } from '@/types';
import { useBrandColor } from '@/components/BrandProvider';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PakaianIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
);

const UtilitiesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>
);

const AksesorisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 9L12 16L22 9L12 2Z" />
    <path d="M2 15L12 22L22 15" />
    <path d="M2 9V15L12 22V9" />
    <path d="M22 9V15L12 22V9" />
  </svg>
);

const EASING = { out: [0.23, 1, 0.32, 1] as const, inOut: [0.77, 0, 0.175, 1] as const, spring: { type: "spring" as const, stiffness: 400, damping: 30 }, springBounce: { type: "spring" as const, stiffness: 300, damping: 20 } };
const DURATION = { micro: 0.1, fast: 0.15, normal: 0.2, medium: 0.3, slow: 0.5 };

interface Product { id: string; name: string; price: number; image_url?: string; slug: string; category: CategoryType; price_tag?: string | null; }

const CATEGORIES = [
  { id: 'pakaian' as CategoryType, label: 'Pakaian', sublabel: 'Apparel', icon: PakaianIcon, description: 'Outerwear, tops& bottoms', spec: 'GARMENT-001' },
  { id: 'utilities' as CategoryType, label: 'Utilities', sublabel: 'Functional', icon: UtilitiesIcon, description: 'Bags, cases & gear', spec: 'UTIL-002' },
  { id: 'aksesoris' as CategoryType, label: 'Aksesoris', sublabel: 'Accents', icon: AksesorisIcon, description: 'Jewelry & details', spec: 'ACCS-003' },
];

const categoryIndexVariants: Variants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.1, duration: DURATION.medium, ease: EASING.out } }) };
const productGridVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const productCardVariants: Variants = { hidden: { opacity: 0, y: 20, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.medium, ease: EASING.out } }, hover: { scale: 1.02, transition: { duration: DURATION.fast, ease: EASING.out } } };

function PressButton({ children, className = '', onClick, href }: { children: React.ReactNode; className?: string; onClick?: () => void; href?: string }) {
  const inner = <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: DURATION.micro, ease: EASING.out }} className={cn(className, "cursor-pointer")}>{children}</motion.div>;
  if (href) return <Link prefetch={false} href={href}>{inner}</Link>;
  return <button onClick={onClick} type="button" className="w-auto bg-transparent border-none p-0 m-0">{inner}</button>;
}

function CategoryCard({ cat, index, isSelected, onClick }: { cat: typeof CATEGORIES[0]; index: number; isSelected: boolean; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = cat.icon;
  const brandColor = useBrandColor();
  const white = '#ffffff';

  return (
    <motion.button custom={index} variants={categoryIndexVariants} initial="hidden" animate="visible" onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className={`relative bg-white py-1.5 px-2.5 md:py-2 md:px-3 text-left group overflow-hidden flex items-center gap-2.5 md:gap-3 ${isSelected ? 'bg-ink text-white' : ''}`}>
      <motion.div className="absolute inset-0 bg-rose origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: isHovered ? 1 : 0 }} transition={{ duration: DURATION.medium, ease: EASING.out }} style={{ zIndex: 0 }} />
      <div className="relative z-10 flex items-center gap-2 md:gap-3 w-full">
        <motion.div className="flex-shrink-0" animate={{ color: isSelected ? white : isHovered ? white : brandColor.color }} transition={{ duration: DURATION.fast }}><Icon /></motion.div>
        <div className="flex items-center gap-1.5 min-w-0">
          <motion.h3 className={`text-xs md:text-[10px] md:text-xs font-display font-medium italic uppercase tracking-tight whitespace-nowrap ${isSelected ? 'text-white' : 'text-ink'}`} animate={{ color: isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#141414' }} transition={{ duration: DURATION.fast }}>{cat.label}</motion.h3>
          <motion.span className={`text-[10px] md:text-[7px] md:text-[8px] font-medium uppercase tracking-widest whitespace-nowrap ${isSelected ? 'text-white/50' : 'text-ink/25'}`} animate={{ color: isSelected ? 'rgba(255,255,255,0.5)' : isHovered ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,20,0.25)' }} transition={{ duration: DURATION.fast }}>— {cat.sublabel}</motion.span>
        </div>
        <motion.span className={`ml-auto text-[6px] font-mono tracking-tighter px-1 py-0.5 flex-shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink/30'}`} animate={{ backgroundColor: isHovered ? 'rgba(255,255,255,0.2)' : isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.05)' }} transition={{ duration: DURATION.fast }}>{cat.spec}</motion.span>
        <motion.div className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-ink/20'}`} animate={{ x: isSelected || isHovered ? 2 : 0, color: isSelected || isHovered ? '#ffffff' : 'rgba(20,20,20,0.2)' }} transition={{ duration: DURATION.fast }}><ChevronRight size={12} strokeWidth={1.5} /></motion.div>
      </div>
    </motion.button>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const brandColor = useBrandColor();
  const darkColor = { color: '#141414' };
  const { addItem } = useCart();
  const router = useRouter();

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('open-quick-buy', { detail: { product } }));
    } else {
      addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url || null, slug: product.slug });
      router.push('/checkout');
    }
  };

  return (
    <motion.div variants={productCardVariants} whileHover="hover" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Link href={`/shop/${product.slug}`} className="block bg-white p-2 md:p-3 group relative overflow-hidden border border-transparent hover:border-ink/5">
        <div className="relative mb-2 md:mb-3 overflow-hidden aspect-[4/5] bg-white flex items-center justify-center border border-ink/5">
          {product.image_url ? (
            <div className="w-full h-full relative z-10 mix-blend-multiply">
              <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-700" sizes="(max-width: 768px) 30vw, 15vw" style={{ filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }} />
            </div>
          ) : (
            <div className="w-[45%] py-12 flex items-center justify-center text-ink/10"><Package size={24} /></div>
          )}
          <motion.div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-ink text-white px-1 py-0.5 text-[5px] md:text-[6px] uppercase tracking-tighter font-mono" animate={{ opacity: isHovered ? 0.7 : 1 }} transition={{ duration: DURATION.fast }}>{product.category.toUpperCase().slice(0, 4)}</motion.div>
        </div>
        <div className="space-y-1">
          <motion.p className="text-[6px] md:text-[7px] font-medium uppercase tracking-[0.15em] text-ink/30 hidden md:block" animate={{ opacity: isHovered ? 0.7 : 1 }} transition={{ duration: DURATION.fast }}>{CATEGORIES.find((c) => c.id === product.category)?.label}</motion.p>
          <motion.h3 className="text-xs md:text-[9px] md:text-[11px] font-display font-medium italic uppercase tracking-tight text-ink line-clamp-2" animate={isHovered ? brandColor : darkColor} transition={{ duration: DURATION.fast }}>{product.name}</motion.h3>
          <motion.div className="flex items-center justify-between pt-1 md:pt-2 border-t border-ink/5 mt-1 md:mt-2" animate={{ opacity: isHovered ? 1 : 0.8 }} transition={{ duration: DURATION.fast }}>
            <div>
              <motion.span className="text-[11px] md:text-[8px] md:text-[10px] font-display font-medium italic text-rose block" animate={{ scale: isHovered ? 1.02 : 1 }} transition={{ duration: DURATION.fast }}>IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0 })}</motion.span>
              {product.price_tag && <motion.span className="text-[5px] md:text-[6px] font-medium uppercase tracking-[0.1em] text-emerald-600 hidden md:inline" animate={{ opacity: isHovered ? 1 : 0.7 }} transition={{ duration: DURATION.fast }}>{product.price_tag}</motion.span>}
            </div>
            
            <motion.button
              onClick={handleQuickBuy}
              className="w-5 h-5 md:w-6 md:h-6 rounded-none bg-ink/5 flex items-center justify-center border border-transparent hover:border-ink/20 hover:bg-ink hover:text-white transition-colors"
              animate={{ backgroundColor: isHovered ? 'rgba(20,20,20,0.1)' : 'rgba(20,20,20,0.05)' }}
            >
              <ShoppingCart className="w-3 h-3" />
            </motion.button>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CategoryClient({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (selectedCategory) return products.filter((p) => p.category === selectedCategory);
    return products;
  }, [selectedCategory, products]);

  // useEffect fetch removed since we use server-side initialProducts

  return (
    <main className="min-h-screen bg-cr noise pt-4 md:pt-20 px-4 md:px-12 pb-[120px]">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.normal, ease: EASING.out }} className="text-xs md:text-[9px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40 flex items-center gap-2">
            <Grid3X3 size={10} className="text-rose" />Category Index
          </motion.h1>
          <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose"><ArrowLeft size={10} className="rotate-180" /><span className="text-[10px] md:text-[7px] md:text-[8px] font-medium uppercase tracking-[0.3em]">Exit</span></PressButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/5 border border-ink/5 mb-3 md:mb-4">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} index={i} isSelected={selectedCategory === cat.id} onClick={() => { setSelectedCategory(selectedCategory === cat.id ? null : cat.id); gridRef.current?.scrollIntoView({ behavior: 'smooth' }); }} />
          ))}
        </div>

        <AnimatePresence>
          {selectedCategory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: DURATION.fast, ease: EASING.out }} className="flex items-center justify-between py-1.5 overflow-hidden mb-3">
              <div className="flex items-center gap-2"><span className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.3em] text-ink/30">Filtering:</span><span className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-rose">{CATEGORIES.find((c) => c.id === selectedCategory)?.label}</span></div>
              <PressButton onClick={() => setSelectedCategory(null)} className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-ink/30 hover:text-rose">Clear</PressButton>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={gridRef} className="border-t border-ink/5 pt-2 md:pt-4">
          <AnimatePresence mode="wait">
            <motion.div key={selectedCategory || 'all'} variants={productGridVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }} transition={{ duration: DURATION.normal }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-ink/5">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="bg-white aspect-[3/4] animate-pulse" />)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 text-center"><p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.3em] text-ink/20">No products in this category</p></motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: DURATION.medium }} className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-[40] bg-cr/95 backdrop-blur-md border-t border-ink/5">
          <div className="max-w-[1800px] mx-auto px-4 md:px-12 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <motion.div className="space-y-0.5" whileHover={{ scale: 1.05 }} transition={{ duration: DURATION.fast }}><p className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Total Units</p><p className="text-lg font-display font-medium italic text-ink">{products.length}</p></motion.div>
              <div className="h-8 w-[1px] bg-ink/10 hidden md:block" />
              <motion.div className="space-y-0.5" whileHover={{ scale: 1.05 }} transition={{ duration: DURATION.fast }}><p className="text-[10px] md:text-[7px] font-medium uppercase tracking-[0.4em] text-ink/20">Active Categories</p><p className="text-lg font-display font-medium italic text-ink">{CATEGORIES.length}</p></motion.div>
            </div>
            <PressButton href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose"><span className="text-xs md:text-[9px] font-medium uppercase tracking-[0.3em]">Full Catalog</span><ChevronRight size={14} /></PressButton>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
