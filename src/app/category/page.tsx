"use client";

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Grid3X3, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CategoryType } from '@/types';
import { useBrandColor } from '@/components/BrandProvider';

// ═══════════════════════════════════════════════════════════════
// CUSTOM MODERN ICONS — NINOC STUDIO
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// EMIL KOWALSKI ANIMATION ENGINE
// ═══════════════════════════════════════════════════════════════

const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
};

const DURATION = {
  fast: 0.15,
  medium: 0.3,
  slow: 0.5,
};

const CATEGORIES = [
  { id: 'pakaian' as CategoryType, label: 'Pakaian', sublabel: 'Apparel', icon: PakaianIcon, description: 'Outerwear, tops & bottoms', spec: 'GARMENT-001', filterName: 'Fashion' },
  { id: 'utilities' as CategoryType, label: 'Utilities', sublabel: 'Functional', icon: UtilitiesIcon, description: 'Bags, cases & gear', spec: 'UTIL-002', filterName: 'Utilities' },
  { id: 'aksesoris' as CategoryType, label: 'Aksesoris', sublabel: 'Accents', icon: AksesorisIcon, description: 'Jewelry & details', spec: 'ACCS-003', filterName: 'Accessories' },
];

const categoryIndexVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: DURATION.medium, ease: EASING.out },
  }),
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY CARD
// ═══════════════════════════════════════════════════════════════

function CategoryCard({ cat, index }: {
  cat: typeof CATEGORIES[0];
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = cat.icon;
  const brandColor = useBrandColor();
  const white = '#ffffff';

  return (
    <motion.div
      custom={index}
      variants={categoryIndexVariants}
      initial="hidden"
      animate="visible"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-white p-4 md:p-6 text-left group overflow-hidden block"
    >
      <Link href={`/shop?filter=${cat.filterName}`} className="absolute inset-0 z-20" />
      
      {/* Background animation on hover */}
      <motion.div
        className="absolute inset-0 bg-rose origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{ duration: DURATION.medium, ease: EASING.out }}
        style={{ zIndex: 0 }}
      />

      {/* Content with z-index */}
      <div className="relative z-10">
        <div className="absolute top-2 right-2 md:top-4 md:right-4">
          <motion.span
            className="text-[6px] font-mono tracking-tighter px-1 py-0.5 bg-ink/5 text-ink/40"
            animate={{ backgroundColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,20,0.05)', color: isHovered ? '#ffffff' : 'rgba(20,20,20,0.4)' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.spec}
          </motion.span>
        </div>

        <motion.div
          animate={{ color: isHovered ? white : brandColor.color }}
          transition={{ duration: DURATION.fast }}
        >
          <Icon />
        </motion.div>

        <div className="space-y-1 md:space-y-2 mt-3 md:mt-6">
          <motion.h3
            className="text-sm md:text-lg font-display font-medium italic uppercase tracking-tight text-ink"
            animate={{ color: isHovered ? '#ffffff' : '#141414' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.label}
          </motion.h3>
          <motion.p
            className="text-[8px] md:text-[9px] font-medium uppercase tracking-widest text-ink/40"
            animate={{ color: isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,20,0.4)' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.sublabel}
          </motion.p>
          <motion.p
            className="text-[9px] md:text-[10px] font-medium leading-relaxed hidden md:block text-ink/60"
            animate={{ color: isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(20,20,20,0.6)' }}
            transition={{ duration: DURATION.fast }}
          >
            {cat.description}
          </motion.p>
        </div>

        <motion.div
          className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-ink/30"
          animate={{ x: isHovered ? 4 : 0, color: isHovered ? '#ffffff' : 'rgba(20,20,20,0.3)' }}
          transition={{ duration: DURATION.fast }}
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CATEGORY PAGE (PURE NAVIGATION HUB)
// ═══════════════════════════════════════════════════════════════

export default function CategoryPage() {
  return (
    <main className="min-h-screen bg-cr noise pt-4 md:pt-20 px-4 md:px-12 flex flex-col">
      <div className="max-w-[1800px] mx-auto w-full flex-grow flex flex-col justify-center pb-24 md:pb-32">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <div className="flex flex-col gap-1 md:gap-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.medium, ease: EASING.out }}
              className="flex items-center gap-2"
            >
              <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}>
                <Grid3X3 size={12} className="text-rose" />
              </motion.div>
              <span className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">Archival Hub</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: DURATION.slow, ease: EASING.out }}
              className="text-xl md:text-3xl font-display font-medium italic tracking-tighter uppercase text-ink leading-none"
            >
              Category Index
            </motion.h1>
          </div>

          {/* Return Back */}
          <Link href="/shop" className="flex items-center gap-2 text-ink/40 hover:text-rose transition-colors group">
            <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ArrowLeft size={12} />
            </motion.div>
            <span className="text-[8px] md:text-[9px] font-medium uppercase tracking-[0.3em]">Return to Catalog</span>
          </Link>
        </div>

        {/* CATEGORY INDEX — CELL-BLOCK GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/5 border border-ink/5 shadow-2xl">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} index={i} />
          ))}
        </div>

      </div>
    </main>
  );
}