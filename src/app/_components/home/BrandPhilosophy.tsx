"use client";

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

export default function BrandPhilosophy() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0, 1, 1, 0]);
  
  return (
    <section 
      ref={ref} 
      className="relative min-h-[60vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-ink py-32 md:py-40"
      style={{ 
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.8) 20%, black 25%, black 75%, rgba(0,0,0,0.8) 80%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0.05) 95%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0.2) 10%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.8) 20%, black 25%, black 75%, rgba(0,0,0,0.8) 80%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0.05) 95%, transparent 100%)' 
      }}
    >
      {/* Abstract background noise/texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none noise" />
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-12 relative z-10 w-full text-center">
        <motion.div style={{ y: y1, opacity }} className="space-y-8 md:space-y-12">
          
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 md:w-16 bg-white/40" />
            <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.4em] text-white/80 font-semibold">
              Manifesto
            </p>
            <div className="h-[1px] w-8 md:w-16 bg-white/40" />
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-7xl font-display font-medium italic uppercase tracking-tighter text-white leading-[0.9]">
            Functionality<br />
            <span className="text-white/70">through absolute</span><br />
            Simplicity.
          </h2>

          <p className="text-sm md:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
            NINOC is more than a store. It is a multidimensional creative house curating 
            premium apparel, artisanal objects, and specialty pantry essentials. 
            We strip away the non-essential to deliver raw, uncompromised quality.
          </p>

        </motion.div>
      </div>
    </section>
  );
}
