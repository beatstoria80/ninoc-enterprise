"use client";

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DURATION, EASING } from '@/lib/animations';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

function FadeUpSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: DURATION.medium, delay, ease: EASING.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function BentoDepartmentGrid() {
  const headerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { type: 'spring', damping: 20, stiffness: 150 }
    }
  };

  return (
    <section className="px-4 md:px-12 max-w-[1800px] mx-auto pb-12 md:pb-20 pt-4 md:pt-6 relative z-30 -mt-8 md:-mt-16">
      <motion.div 
        variants={headerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4 border-b border-ink/5 pb-4"
      >
        <div>
          <motion.h2 variants={itemVariants} className="text-2xl md:text-4xl font-display font-medium italic uppercase tracking-tighter text-ink leading-none">
            Shop by Category
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xs md:text-sm text-ink/60 mt-2 tracking-wide uppercase font-medium">
            Curated collections of the NINOC lifestyle
          </motion.p>
        </div>
        <motion.div variants={itemVariants}>
          <Link href="/shop" className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-ink/50 hover:text-rose transition-colors flex items-center gap-2">
            View All Catalog <ArrowRight size={14} />
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Pillar 1: Apparel (Large Left) */}
        <FadeUpSection className="md:col-span-8 aspect-[4/3] md:aspect-auto md:h-[600px] group relative overflow-hidden bg-ink/5 block" delay={0.1}>
          <Link href="/shop?filter=Apparel" className="absolute inset-0 z-20">
            <span className="sr-only">Shop Apparel</span>
          </Link>
          <Image 
            src="/banner_ninoc_1.png" 
            alt="NINOC Apparel" 
            fill 
            className="object-cover object-top transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-6 md:p-10 pointer-events-none">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70 mb-2">Pillar 01</p>
            <h3 className="text-3xl md:text-5xl font-display italic font-medium uppercase text-white tracking-tighter mb-2 group-hover:text-rose transition-colors">Apparel</h3>
            <p className="text-white/80 text-xs md:text-sm max-w-sm">Functional garments designed for the modern uniform. Precision meets comfort.</p>
          </div>
        </FadeUpSection>

        <div className="md:col-span-4 flex flex-col gap-4 md:gap-6">
          {/* Pillar 2: Objects */}
          <FadeUpSection className="aspect-[4/3] md:h-[calc(300px-12px)] group relative overflow-hidden bg-ink/5 block" delay={0.2}>
            <Link href="/shop?filter=Objects" className="absolute inset-0 z-20">
              <span className="sr-only">Shop Objects & Consumer Goods</span>
            </Link>
            <div className="absolute inset-0 bg-ink flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-6 pointer-events-none">
              <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-white/50 mb-1">Pillar 02</p>
              <h3 className="text-xl md:text-2xl font-display italic font-medium uppercase text-white tracking-tighter mb-1 group-hover:text-rose transition-colors">Objects</h3>
              <p className="text-white/60 text-[10px] md:text-xs">Curated homeware and artisan goods.</p>
            </div>
          </FadeUpSection>

          {/* Pillar 3: Pantry */}
          <FadeUpSection className="aspect-[4/3] md:h-[calc(300px-12px)] group relative overflow-hidden bg-ink/5 block" delay={0.3}>
            <Link href="/shop?filter=Pantry" className="absolute inset-0 z-20">
              <span className="sr-only">Shop Pantry & Café</span>
            </Link>
            <div className="absolute inset-0 bg-[#e5e5e5] flex items-center justify-center">
               <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 110 8h-1" />
                <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-6 pointer-events-none">
              <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-ink/60 mb-1">Pillar 03</p>
              <h3 className="text-xl md:text-2xl font-display italic font-medium uppercase text-ink tracking-tighter mb-1 group-hover:text-rose transition-colors">Pantry</h3>
              <p className="text-ink/70 text-[10px] md:text-xs">Specialty coffee & robust flavors.</p>
            </div>
          </FadeUpSection>
        </div>
      </div>
    </section>
  );
}
