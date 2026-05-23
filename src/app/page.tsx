"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { ShieldCheck, Zap, Package, Paperclip, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import DragSlider from '@/components/DragSlider';

// ═══════════════════════════════════════════════════════════════
// CINEMATIC MOTION ENGINE — NINOC STUDIO
// Physics: [0.16, 1, 0.3, 1] — Fast out, slow settle
// ═══════════════════════════════════════════════════════════════

const MOTION = {
  ease: [0.16, 1, 0.3, 1] as const,
  easeSnappy: [0.4, 0, 0.2, 1] as const,
  durationHero: 1.0,
  durationSection: 0.8,
  durationMobile: 0.6,
  durationMicro: 0.4,
} as const;

// Word-level stagger for hero heading
const wordVariants: Variants = {
  hidden: { y: 60, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.12, duration: MOTION.durationHero, ease: MOTION.ease },
  }),
};

// Product card entrance animation — staggered sequence
const productCardVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { 
      delay: i * 0.15, 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] 
    },
  }),
};

// Nested image entrance
const cardImageVariants: Variants = {
  hidden: { scale: 1.05, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } 
  },
};

// Nested content entrance
const cardContentVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  },
};

// Trust icon spring bounce
const trustIconVariants: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  }),
};

// Metadata delayed fade-in
const metadataVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { delay: 0.3 + i * 0.12, duration: 0.6, ease: MOTION.ease },
  }),
};

// ═══════════════════════════════════════════════════════════════
// PORTRAIT CAROUSEL — 5 images cycling on hover, 2s auto-stop
// ═══════════════════════════════════════════════════════════════

const PORTRAIT_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop",
];
const CAROUSEL_INTERVAL = 200;

function PortraitImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCycle = () => {
    setIsHovered(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
    setCurrentIndex(0);
  };

  const startCycle = () => {
    setIsHovered(true);
    setCurrentIndex(0);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => { stopCycle(); }, 2000);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % PORTRAIT_IMAGES.length);
    }, CAROUSEL_INTERVAL);
  };

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
      transition={{ duration: 1.2, ease: MOTION.ease }}
      className="aspect-[3/4] md:aspect-[4/5] bg-white overflow-hidden border border-ink/5 relative shadow-2xl shadow-ink/5"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
      style={{ cursor: 'pointer' }}
    >
      {PORTRAIT_IMAGES.map((src, i) => (
        <div key={src} className="absolute inset-0" style={{ opacity: currentIndex === i && isHovered ? 1 : currentIndex === i && !isHovered ? 1 : 0, zIndex: currentIndex === i ? 2 : 1 }}>
          <Image src={src} alt={`Archival Garment ${i + 1}`} fill className={`object-cover transition-all duration-500 ${isHovered ? 'grayscale-0 scale-105' : 'grayscale'}`} priority={i === 0} />
        </div>
      ))}
      {!isHovered && (
        <div className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-1000 z-10 pointer-events-none">
          <Image src={PORTRAIT_IMAGES[0]} alt="" fill className="object-cover" priority />
        </div>
      )}
      {isHovered && (
        <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
          {PORTRAIT_IMAGES.map((_, i) => (
            <motion.div key={i} className="w-1 h-1 rounded-full" animate={{ backgroundColor: currentIndex === i ? '#E8527A' : 'rgba(20,20,20,0.2)', scale: currentIndex === i ? 1.4 : 1 }} transition={{ duration: 0.15 }} />
          ))}
        </div>
      )}
      <div className="absolute top-2 left-1 bg-ink text-white px-1 py-0.5 text-[6px] uppercase font-mono tracking-tighter z-20">SPEC-001</div>
      <div className="absolute inset-0 bg-gradient-to-t from-cr/20 to-transparent hidden md:block z-20" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: { id: string; name: string; price: number; image_url?: string; slug: string; category?: string; price_tag?: string | null };
  index: number;
}

function ProductCard({ product, index }: ProductCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <motion.div ref={ref} variants={productCardVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'} custom={index}>
      <Link href={`/shop/${product.slug}`} className="bg-white p-3 md:p-4 group relative overflow-hidden block border border-transparent hover:border-ink/5 transition-all duration-500" style={{ transition: 'all 0.5s' }}>
        <motion.div variants={cardImageVariants} className="aspect-[3/4] overflow-hidden mb-2 md:mb-3 relative bg-white border border-ink/5" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
          {product.image_url && (
            <Image src={product.image_url} alt={product.name} fill className="object-contain transition-all duration-1000 group-hover:grayscale-0 grayscale scale-95 group-hover:scale-100" />
          )}
          <div className="absolute top-0 left-0 bg-ink text-white px-1.5 py-0.5 text-[6px] uppercase tracking-tighter z-10">NINOC SPEC-{(index + 101).toString()}</div>
        </motion.div>
        
        <motion.div variants={cardContentVariants} className="space-y-1 md:space-y-1.5">
          <p className="text-[7px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 md:text-ink/30">{product.category || "Garment Origin"}</p>
          <motion.h3 className="text-[9px] md:text-base font-display font-medium italic uppercase tracking-tight line-clamp-1" whileHover={{ color: '#E8527A' }} transition={{ duration: 0.3 }}>
            {product.name}
          </motion.h3>
          <motion.div className="flex items-center justify-between pt-2 md:pt-3 border-t border-ink/5 mt-2 md:mt-3">
            <div className="space-y-0.5">
              <p className="text-[6px] uppercase tracking-widest text-ink/20 leading-none">Investment Value</p>
              {product.price_tag && (
                <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-rose leading-none pt-1">
                  {product.price_tag}
                </p>
              )}
              <p className="text-[9px] md:text-sm font-display font-medium italic text-ink pt-1">IDR {product.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
            <motion.div className="w-5 h-5 md:w-7 md:h-7 rounded-none bg-ink/5 flex items-center justify-center" whileHover={{ backgroundColor: '#E8527A', color: '#ffffff' }} transition={{ duration: 0.3 }}>
              <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.3, ease: MOTION.ease }}>
                <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRUST ITEM
// ═══════════════════════════════════════════════════════════════

function TrustItem({ icon, title, desc, index }: { icon: React.ReactNode; title: string; desc: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <motion.div ref={ref} className="flex flex-col items-center text-center space-y-2 md:space-y-6" variants={metadataVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'} custom={index}>
      <motion.div className="w-8 h-8 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center text-rose" variants={trustIconVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'} custom={index}>
        {icon}
      </motion.div>
      <div className="space-y-0 md:space-y-2">
        <h3 className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest leading-none">{title}</h3>
        <p className="text-[6px] md:text-[8px] font-medium uppercase tracking-tighter md:tracking-widest text-ink/60 md:text-ink/30 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FADE-UP SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════

function FadeUpSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════

interface Product {
  id: string; name: string; price: number; image_url?: string; slug: string; category?: string; price_tag?: string | null;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').limit(4);
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
    <div className="mobile-momentum select-none">

      {/* HERO SECTION */}
      <section className="relative md:pt-24 pt-2 pb-0 px-4 md:px-12 max-w-[1800px] mx-auto border-b border-ink/5">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center lg:items-start">

          {/* Left: Branding */}
          <div className="lg:col-span-4 space-y-2.5 md:space-y-6 lg:pt-40">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5, ease: MOTION.ease }} className="flex items-center gap-2 text-rose">
              <Paperclip className="w-3 h-3 md:w-[18px] md:h-[18px]" />
              <span className="text-[7px] md:text-[10px] font-medium uppercase tracking-[0.3em]">Origin Specification</span>
            </motion.div>
            <h1 className="text-3xl md:text-8xl font-display font-medium italic tracking-tighter text-ink leading-[0.75] uppercase">
              {["Archival", "Apparel"].map((word, wi) => (
                <span key={word} className="block overflow-hidden">
                  <motion.span variants={wordVariants} initial="hidden" animate="visible" custom={wi} className="block">{word}</motion.span>
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7, ease: MOTION.ease }} className="text-[8px] md:text-sm font-medium leading-tight md:leading-relaxed text-ink/80 md:text-ink/60 max-w-[120px] md:max-w-sm uppercase tracking-tight md:tracking-wider">
              Established for the preservation of garment integrity. <span className="hidden md:inline">Our collection represents a curated selection of technical excellence and timeless design.</span>
            </motion.p>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5, ease: MOTION.ease }}>
              <Link href="/shop" className="group inline-flex items-center gap-2 md:gap-6 text-ink hover:text-rose transition-colors duration-300 relative">
                <span className="text-[7px] md:text-[11px] font-medium uppercase tracking-[0.2em] md:tracking-[0.4em]">Browse Catalog</span>
                <div className="relative w-4 md:w-12 h-[1px] overflow-hidden">
                  <motion.div className="absolute inset-0 bg-ink/20" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8, ease: MOTION.ease }} style={{ originX: 0 }} />
                  <motion.div className="absolute inset-0 bg-rose origin-left" initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.4, ease: MOTION.ease }} />
                  <motion.span className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" whileHover={{ x: 4 }} transition={{ duration: 0.3, ease: MOTION.ease }}>
                    <ChevronRight className="w-2 h-2 md:w-3 md:h-3 text-rose" />
                  </motion.span>
                </div>
              </Link>
            </motion.div>

            {/* Mobile Metadata - Relocated for balance */}
            <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
              {[{ label: 'Year', value: '2024' }, { label: 'Loc', value: 'BDG, ID' }, { label: 'Phil', value: 'Simplicity' }].map((item, i) => (
                <motion.div key={item.label} className="space-y-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: MOTION.ease }}>
                  <p className="text-[7px] font-medium uppercase tracking-widest text-ink/40">{item.label}</p>
                  <p className="text-[9px] font-medium text-ink uppercase italic leading-none">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Middle: Portrait Carousel */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <PortraitImageCarousel />
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.6, ease: MOTION.ease }} className="absolute -bottom-8 -right-8 bg-white p-6 rounded-none border border-ink/5 shadow-xl hidden md:block z-30">
              <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/30 mb-2">Technical Detail</p>
              <p className="text-[10px] font-medium text-ink uppercase">Hand-stitched precision<br/>Industrial Grade Fabrics</p>
            </motion.div>
          </div>

          {/* Right: Metadata Sidebar */}
          <div className="col-span-2 lg:col-span-3 lg:pt-[450px] -mt-10 md:mt-0 lg:mt-0">
            {/* Desktop only sidebar content */}
            <div className="hidden md:flex flex-col space-y-3 border-l border-ink/5 pl-8">
              {[{ label: 'Year', value: 'Est. 2024' }, { label: 'Location', value: 'Bandung, Indonesia' }, { label: 'Philosophy', value: '"Functionality through absolute simplicity."' }].map((item, i) => (
                <motion.div key={item.label} className="space-y-0" variants={metadataVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} custom={i}>
                  <p className="text-[8px] font-medium uppercase tracking-widest text-ink/20">{item.label}</p>
                  <p className={`text-[10px] font-medium text-ink ${i === 2 ? 'italic leading-tight' : ''}`}>{item.value}</p>
                </motion.div>
              ))}
              <motion.div className="bg-ink text-white p-8 rounded-none space-y-6 hidden lg:block mt-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.5, duration: 0.7, ease: MOTION.ease }}>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-rose" />
                  <span className="text-[10px] font-medium uppercase tracking-widest">Origin Verified</span>
                </div>
                <p className="text-[9px] font-medium uppercase leading-relaxed tracking-wider text-white/80">Every garment is authenticated through rigorous archival protocols and secure fulfillment.</p>
              </motion.div>
            </div>
          </div>
        </div>

      </section>

      {/* CATALOG — PURE JS POINTER DRAG */}
      <section id="archive-catalog" className="mt-0 md:mt-2 px-4 md:px-12 max-w-[1800px] mx-auto">
        <motion.div className="flex items-end justify-between border-b border-ink/5 pb-1 md:pb-4 mb-0.5 md:mb-6" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.7, ease: MOTION.ease }}>
          <h2 className="text-sm md:text-4xl font-display font-medium italic tracking-tighter uppercase text-ink leading-none translate-y-[1.5px] md:translate-y-0">New Releases</h2>
          <Link href="/shop" className="text-[8px] md:text-[10px] font-medium uppercase tracking-widest text-ink hover:text-rose transition-colors duration-300 leading-none">View All</Link>
        </motion.div>

        {/* DRAG SLIDER — mouse drag to scroll */}
        <div className="relative -mx-4 md:mx-0">
          <DragSlider className="flex gap-px w-full">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="w-[48vw] md:w-[300px] aspect-[3/4] bg-white animate-pulse flex-shrink-0" />
              ))
            ) : (
              products.map((product, i) => (
                <div key={product.id} className="w-[48vw] md:w-[300px] flex-shrink-0">
                  <ProductCard product={product} index={i} />
                </div>
              ))
            )}
          </DragSlider>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block" />
        </div>
      </section>

      {/* TRUST SYMBOLS */}
      <FadeUpSection delay={0.2}>
        <section className="md:mt-40 mt-8 md:mb-40 mb-12 border-y border-ink/5 py-4 md:py-24 bg-white/30 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-20">
            <TrustItem icon={<ShieldCheck className="w-4 h-4 md:w-7 md:h-7" />} title="Quality Assured" desc="Rigorous inspection." index={0} />
            <TrustItem icon={<Zap className="w-4 h-4 md:w-7 md:h-7" />} title="Instant Logistics" desc="Rapid fulfillment." index={1} />
            <TrustItem icon={<Package className="w-4 h-4 md:w-7 md:h-7" />} title="Secure Storage" desc="Protected storage." index={2} />
          </div>
        </section>
      </FadeUpSection>
    </div>
  );
}