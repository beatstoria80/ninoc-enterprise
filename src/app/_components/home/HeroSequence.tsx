"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Paperclip, ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { charVariants, metadataVariants, EASING, DURATION } from '@/lib/animations';
import Link from '@/components/LocalizedLink';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function PressButton({ children, className = '', onClick, href, whileHover, whileTap }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  whileHover?: Parameters<typeof motion.div>[0]['whileHover'];
  whileTap?: Parameters<typeof motion.div>[0]['whileTap'];
}) {
  const inner = (
    <motion.div
      whileHover={whileHover as any}
      whileTap={whileTap as any}
      transition={{ duration: DURATION.micro, ease: EASING.out }}
      className={cn(className, "cursor-pointer")}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return (
    <button onClick={onClick} type="button" className="w-auto bg-transparent border-none p-0 m-0">
      {inner}
    </button>
  );
}

interface HeroSequenceProps {
  dict: any;
  isReturningVisitor: boolean;
  scene: 'hero' | 'transitioning' | 'archive';
}

export default function HeroSequence({ dict, isReturningVisitor, scene }: HeroSequenceProps) {
  const [heroState, setHeroState] = useState<'intro' | 'expanded'>(isReturningVisitor ? 'expanded' : 'intro');

  useEffect(() => {
    if (scene === 'archive' && heroState === 'intro') {
      const timer = setTimeout(() => {
        setHeroState('expanded');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [scene, heroState]);

  return (
    <div className="relative w-full overflow-hidden bg-white border-b border-ink/5 min-h-[280px] md:min-h-[35vw] lg:min-h-[34vw] 2xl:min-h-[600px]">
      <AnimatePresence>
        {heroState === 'intro' ? (
          <motion.section 
            key="intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASING.inOut }}
            className="relative md:pt-16 pt-2 pb-0 px-4 md:px-12 max-w-[1800px] mx-auto"
          >
            <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-12 items-center lg:items-start">

              {/* Left: Branding */}
              <div className="lg:col-span-4 space-y-2.5 md:space-y-4 lg:pt-48 xl:pt-56 2xl:pt-64">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-2 text-rose"
                >
                  <Paperclip className="w-3 h-3 md:w-[18px] md:h-[18px]" />
                  <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.15em] md:tracking-widest whitespace-nowrap">Origin Specification</span>
                </motion.div>

                <h1 className="text-3xl md:text-5xl lg:text-7xl font-display font-medium italic tracking-tighter text-ink leading-[0.9] uppercase">
                  {"NINOC STORE".split(" ").map((word: string, wi: number) => (
                    <span key={word + wi} className="block overflow-hidden">
                      {word.split("").map((char: string, ci: number) => (
                        <motion.span key={ci} variants={charVariants} initial="hidden" animate="visible" custom={wi * 8 + ci} className="inline-block">
                          {char}
                        </motion.span>
                      ))}
                    </span>
                  ))}
                </h1>

                <motion.p
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="text-[11px] md:text-sm font-medium leading-snug md:leading-relaxed text-ink/60 md:text-ink/60 max-w-[260px] md:max-w-sm uppercase tracking-tight md:tracking-wider"
                >
                  {dict.home.heroSubtitle} <span className="hidden md:inline">{dict.home.craftDesc}</span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, x: -30, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.6, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                >
                  <PressButton href="/shop" className="group inline-flex items-center gap-2 text-ink">
                    <span className="md:hidden inline-flex items-center gap-1.5 bg-ink/5 px-3 py-1.5 border border-ink/10">
                      <span className="text-xs md:text-[7px] font-medium uppercase tracking-[0.2em]">Catalog</span>
                      <ArrowRight size={10} className="text-rose group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="hidden md:inline text-sm md:text-[11px] font-medium uppercase tracking-[0.4em]">Browse Category</span>
                    <div className="hidden md:inline relative w-12 h-[1px] overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-ink/20"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1, duration: DURATION.slow, ease: EASING.out }}
                        style={{ originX: 0 }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-rose origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: DURATION.fast, ease: EASING.out }}
                      />
                      <motion.span
                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        whileHover={{ x: 4 }}
                        transition={{ duration: DURATION.fast, ease: EASING.out }}
                      >
                        <ChevronRight className="w-3 h-3 text-rose" />
                      </motion.span>
                    </div>
                  </PressButton>
                </motion.div>

                {/* Mobile Metadata */}
                <div className="flex items-center gap-4 mt-4 md:hidden">
                  {[
                    { label: 'year', value: '2024' },
                    { label: 'loc', value: 'bdg, id' },
                    { label: 'phil', value: 'simplicity' }
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      className="flex flex-col items-start text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <p className="text-[8px] font-normal tracking-[0.15em] text-ink/25 leading-none mb-1 lowercase">{item.label}</p>
                      <p className="text-[10px] font-medium text-ink/50 lowercase leading-none tracking-wide whitespace-nowrap">{item.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Middle: Portrait — cinematic one-shot reveal */}
              <div className="lg:col-span-4 relative mt-0 z-50">
                <motion.div
                  transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  className="aspect-[4/4] md:aspect-[3/4] lg:aspect-[4/5] bg-white overflow-hidden relative shadow-2xl shadow-ink/5 border border-ink/5"
                >
                  <motion.div
                    initial={{ 
                      clipPath: 'inset(0 0 100% 0)',
                      scale: 1.08,
                      filter: 'blur(8px)'
                    }}
                    animate={{ 
                      clipPath: 'inset(0 0 0% 0)',
                      scale: 1,
                      filter: 'blur(0px)'
                    }}
                    transition={{ 
                      duration: 1.4, 
                      ease: [0.23, 1, 0.32, 1],
                      delay: 0.15
                    }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <Image src="/banner_ninoc_1.png" alt="NINOC Intro" fill sizes="100vw" className="object-cover object-top" priority />
                  </motion.div>

                  {/* SPEC label */}
                  <motion.div
                    className="absolute top-2 left-1 bg-ink text-white px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-tighter z-20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: DURATION.normal }}
                  >
                    SPEC-001
                  </motion.div>
                </motion.div>

                {/* Technical Detail card (Uncropped & Neatly Positioned Inside Frame) */}
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white/95 backdrop-blur-md p-4 rounded-lg border border-slate-200/80 shadow-2xl hidden md:block z-30"
                >
                  <p className="text-[11px] md:text-[8px] font-mono font-bold uppercase tracking-[0.3em] text-ink/50 mb-1.5">Enterprise Store</p>
                  <p className="text-xs md:text-[10px] font-mono font-bold text-ink uppercase leading-snug">Curated with precision<br />Apparel · Objects · Pantry</p>
                </motion.div>
              </div>

              {/* Right: Metadata Sidebar (Pushed Down Significantly) */}
              <div className="col-span-2 lg:col-span-4 lg:pt-72 xl:pt-88 2xl:pt-[380px] -mt-10 md:mt-0 lg:mt-0">
                <div className="hidden md:flex flex-col space-y-3 border-l border-ink/5 pl-8">
                  {[{ label: 'Year', value: 'Est. 2024' }, { label: 'Location', value: 'Bandung, Indonesia' }, { label: 'Philosophy', value: '"Functionality through absolute simplicity."' }].map((item, i) => (
                    <motion.div key={item.label} className="space-y-0" variants={metadataVariants} initial="hidden" animate="visible" custom={i}>
                      <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-widest text-ink/20">{item.label}</p>
                      <p className={`text-xs md:text-[10px] font-medium text-ink ${i === 2 ? 'italic leading-tight' : ''}`}>{item.value}</p>
                    </motion.div>
                  ))}

                  {/* Origin Verified card */}
                  <motion.div
                    className="bg-ink text-white p-8 rounded-none space-y-6 hidden lg:block mt-8"
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-rose">
                        <ShieldCheck size={18} />
                      </div>
                      <span className="text-xs md:text-[10px] font-medium uppercase tracking-widest">Origin Verified</span>
                    </div>
                    <div className="text-sm md:text-[11px] font-medium uppercase leading-loose tracking-widest !text-white !opacity-100">Not just products. These are curated artifacts — from the runway to the roastery to the living room.</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section 
            key="expanded"
            className="absolute inset-0 w-full overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Banner Image Target */}
            <motion.div
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <Image src="/banner_ninoc_1.png" alt="NINOC STORE" fill sizes="100vw" className="object-cover object-top" priority />
            </motion.div>

            {/* Subtle gradient */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent z-10" 
            />

            {/* Overlay Text */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8 lg:p-12"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 max-w-[1800px] mx-auto h-full relative">
                {/* Centered Browse Catalog Button */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto">
                  <PressButton href="/shop" className="group inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-6 py-3 border border-white/20 text-white hover:bg-white hover:text-ink transition-all duration-300">
                      <span className="text-[8px] md:text-xs font-medium uppercase tracking-[0.3em]">catalog</span>
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </PressButton>
                </div>

                {/* Empty left space placeholder to push metadata to the right */}
                <div className="flex-1"></div>
                
                {/* Right Metadata Desktop Only */}
                <div className="hidden md:flex items-end gap-6 lg:gap-8">
                  {[
                    { label: 'Year', value: 'Est. 2024' },
                    { label: 'Location', value: 'Bandung, ID' },
                    { label: 'Philosophy', value: 'Simplicity' }
                  ].map((item, i) => (
                    <div key={item.label} className="text-right">
                      <p className="text-[7px] font-medium uppercase tracking-widest text-white/35 mb-0.5">{item.label}</p>
                      <p className="text-[9px] font-medium text-white/70 uppercase tracking-wide">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
