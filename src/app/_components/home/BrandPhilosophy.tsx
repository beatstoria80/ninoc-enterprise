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
      className="relative min-h-[30vh] md:min-h-[40vh] flex items-center justify-center overflow-hidden py-10 md:py-16 -mt-8 md:-mt-16 z-20"
    >
      {/* Masked Background - Applies the feather effect only to the black bg, not the text */}
      <div 
        className="absolute inset-0 bg-ink"
        style={{ 
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.013) 2%, rgba(0,0,0,0.049) 4%, rgba(0,0,0,0.104) 6%, rgba(0,0,0,0.175) 8%, rgba(0,0,0,0.259) 10%, rgba(0,0,0,0.352) 12%, rgba(0,0,0,0.45) 14%, rgba(0,0,0,0.55) 16%, rgba(0,0,0,0.648) 18%, rgba(0,0,0,0.741) 20%, rgba(0,0,0,0.825) 22%, rgba(0,0,0,0.896) 24%, rgba(0,0,0,0.951) 26%, rgba(0,0,0,0.987) 28%, black 30%, black 70%, rgba(0,0,0,0.987) 72%, rgba(0,0,0,0.951) 74%, rgba(0,0,0,0.896) 76%, rgba(0,0,0,0.825) 78%, rgba(0,0,0,0.741) 80%, rgba(0,0,0,0.648) 82%, rgba(0,0,0,0.55) 84%, rgba(0,0,0,0.45) 86%, rgba(0,0,0,0.352) 88%, rgba(0,0,0,0.259) 90%, rgba(0,0,0,0.175) 92%, rgba(0,0,0,0.104) 94%, rgba(0,0,0,0.049) 96%, rgba(0,0,0,0.013) 98%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.013) 2%, rgba(0,0,0,0.049) 4%, rgba(0,0,0,0.104) 6%, rgba(0,0,0,0.175) 8%, rgba(0,0,0,0.259) 10%, rgba(0,0,0,0.352) 12%, rgba(0,0,0,0.45) 14%, rgba(0,0,0,0.55) 16%, rgba(0,0,0,0.648) 18%, rgba(0,0,0,0.741) 20%, rgba(0,0,0,0.825) 22%, rgba(0,0,0,0.896) 24%, rgba(0,0,0,0.951) 26%, rgba(0,0,0,0.987) 28%, black 30%, black 70%, rgba(0,0,0,0.987) 72%, rgba(0,0,0,0.951) 74%, rgba(0,0,0,0.896) 76%, rgba(0,0,0,0.825) 78%, rgba(0,0,0,0.741) 80%, rgba(0,0,0,0.648) 82%, rgba(0,0,0,0.55) 84%, rgba(0,0,0,0.45) 86%, rgba(0,0,0,0.352) 88%, rgba(0,0,0,0.259) 90%, rgba(0,0,0,0.175) 92%, rgba(0,0,0,0.104) 94%, rgba(0,0,0,0.049) 96%, rgba(0,0,0,0.013) 98%, transparent 100%)' 
        }}
      />
      
      {/* Abstract background noise/texture - Placed OUTSIDE the mask to naturally dither the gradient banding */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none noise z-10 mix-blend-overlay" />
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-12 relative z-20 w-full text-center">
        <motion.div style={{ y: y1, opacity }} className="space-y-8 md:space-y-12">
          


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
