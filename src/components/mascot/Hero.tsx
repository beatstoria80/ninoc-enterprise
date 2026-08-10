"use client";

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Paperclip, ArrowRight, Sparkles } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { charVariants, metadataVariants, EASING } from '@/lib/animations';
import InteractiveMascotVideo from './InteractiveMascotVideo';

interface HeroProps {
  dict?: any;
  className?: string;
}

export const Hero: React.FC<HeroProps> = ({ dict, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const heroSubtitle = dict?.home?.heroSubtitle || "Archival Essentials & Precision Artifacts";
  const craftDesc = dict?.home?.craftDesc || "Curated with absolute simplicity for contemporary life.";

  return (
    <section
      ref={containerRef}
      className={`no-drag relative w-full overflow-hidden bg-white border-b border-ink/5 select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* 16:9 Aspect Ratio Container for 1920x1080 design proportion on Desktop */}
      <div className="relative w-full max-w-[1920px] mx-auto min-h-[580px] md:aspect-[16/9] flex flex-col justify-between p-4 md:p-8 lg:p-12 bg-white">
        
        {/* Top Spec Bar */}
        <div className="flex items-center justify-between z-20 pb-2 border-b border-ink/5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: EASING.out }}
            className="flex items-center gap-2 text-rose pointer-events-auto"
          >
            <Paperclip className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[11px] font-mono font-medium uppercase tracking-[0.2em]">
              SPEC-001 // VIDEO MOTION STATE ENGINE
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: EASING.out }}
            className="hidden md:flex items-center gap-3 text-ink/40 text-[10px] font-mono uppercase tracking-widest pointer-events-auto"
          >
            <Sparkles className="w-3 h-3 text-rose animate-pulse" />
            <span>EST. 2024 · BANDUNG ID</span>
          </motion.div>
        </div>

        {/* Main Grid: Left Copy, Center Mascot, Right Technical Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center my-auto py-4 md:py-0 z-20">
          
          {/* Left Column: Brand & Copy */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6 text-left pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: EASING.out }}
            >
              <h1 className="text-3xl md:text-5xl lg:text-6xl 2xl:text-7xl font-display font-medium italic tracking-tighter text-ink uppercase leading-[0.9]">
                {"NINOC STORE".split(" ").map((word, wi) => (
                  <span key={word + wi} className="block overflow-hidden">
                    {word.split("").map((char, ci) => (
                      <motion.span
                        key={ci}
                        variants={charVariants}
                        initial="hidden"
                        animate="visible"
                        custom={wi * 8 + ci}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                ))}
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: EASING.out }}
              className="text-xs md:text-sm font-medium leading-relaxed text-ink/70 max-w-sm uppercase tracking-wider"
            >
              {heroSubtitle} <span className="hidden md:inline">{craftDesc}</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: EASING.out }}
              className="pt-2"
            >
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 bg-ink text-white px-6 py-3.5 text-xs md:text-sm font-medium uppercase tracking-[0.25em] hover:bg-rose transition-colors duration-300 shadow-lg shadow-ink/10 cursor-pointer pointer-events-auto"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>

            {/* Mobile Metadata */}
            <div className="flex items-center gap-4 mt-6 md:hidden">
              {[
                { label: 'Year', value: '2024' },
                { label: 'Location', value: 'BDG, ID' },
                { label: 'Motion', value: 'Interactive' }
              ].map((item) => (
                <div key={item.label} className="flex flex-col">
                  <span className="text-[8px] font-mono text-ink/40 uppercase">{item.label}</span>
                  <span className="text-[10px] font-medium text-ink/75 uppercase">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Column: Interactive Mascot Centerpiece */}
          <div className="lg:col-span-5 h-[340px] md:h-[460px] lg:h-[520px] 2xl:h-[600px] relative flex items-center justify-center pointer-events-auto">
            <InteractiveMascotVideo className="w-full h-full" />
          </div>

          {/* Right Column: Technical Details & Verification Card */}
          <div className="lg:col-span-3 hidden lg:flex flex-col justify-between space-y-6 pl-4 border-l border-ink/5 pointer-events-auto">
            <div className="space-y-4">
              {[{ label: 'Year', value: 'Est. 2024' }, { label: 'Location', value: 'Bandung, Indonesia' }, { label: 'Philosophy', value: '"Functionality through absolute simplicity."' }].map((item, i) => (
                <motion.div
                  key={item.label}
                  variants={metadataVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  className="space-y-0.5"
                >
                  <p className="text-[9px] font-mono font-medium uppercase tracking-widest text-ink/30">{item.label}</p>
                  <p className={`text-xs font-medium text-ink ${i === 2 ? 'italic leading-tight text-ink/80' : ''}`}>{item.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Origin Verified Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.8, ease: EASING.out }}
              className="bg-ink text-white p-6 space-y-4 shadow-xl border border-white/10"
            >
              <div className="flex items-center gap-2.5 text-rose">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-white">Origin Verified</span>
              </div>
              <p className="text-[11px] font-medium uppercase leading-relaxed text-white/80 tracking-wider">
                Curated artifacts — from the runway to the roastery to the living room.
              </p>
            </motion.div>
          </div>

        </div>

        {/* Bottom Bar / Desktop Footer Info */}
        <div className="hidden md:flex items-center justify-between z-20 pt-2 border-t border-ink/5 text-[9px] font-mono uppercase tracking-widest text-ink/40">
          <div>NINOC® SYSTEM v2.4 // ALL RIGHTS RESERVED</div>
          <div className="flex gap-6">
            <span>[CURSOR TRACKED]</span>
            <span>[MOTION ENGINE]</span>
            <span>[60 FPS TARGET]</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
