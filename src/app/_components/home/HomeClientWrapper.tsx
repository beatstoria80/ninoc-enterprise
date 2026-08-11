"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import HeroSequence from './HeroSequence';
import { DynamicBanner } from '@/components/home/DynamicBanner';
import HomeProductSlider from './HomeProductSlider';
import BentoDepartmentGrid from './BentoDepartmentGrid';
import BrandPhilosophy from './BrandPhilosophy';
import ConnectSection from './ConnectSection';
import Image from 'next/image';
import { EASING, DURATION } from '@/lib/animations';

interface Product {
  id: string; name: string; price: number; image_url?: string; slug: string; category?: any; price_tag?: string | null;
}

interface HomeClientWrapperProps {
  products: Product[];
  dict: any;
}

import { ArrowRight } from 'lucide-react';
import InteractiveMascotVideo from '@/components/mascot/InteractiveMascotVideo';

export default function HomeClientWrapper({ products, dict }: HomeClientWrapperProps) {
  const [scene, setScene] = useState<'hero' | 'transitioning' | 'archive'>('hero');
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });
  const videoScale = useTransform(smoothProgress, [0, 1], [1, 1.05]);

  useEffect(() => {
    if (scene === 'hero') {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      window.dispatchEvent(new CustomEvent('hide-mobile-nav'));
    } else {
      document.body.style.overflow = 'auto';
      window.dispatchEvent(new CustomEvent('show-mobile-nav'));
    }
    return () => { 
      document.body.style.overflow = 'auto'; 
      window.dispatchEvent(new CustomEvent('show-mobile-nav'));
    };
  }, [scene]);

  useEffect(() => {
    const handleReplay = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.addEventListener('replay-opening', handleReplay);
    return () => window.removeEventListener('replay-opening', handleReplay);
  }, []);

  useEffect(() => {
    const handleSkip = () => {
      if (typeof window !== 'undefined') sessionStorage.setItem('ninoc_intro_played', 'true');
      setScene('archive');
      setIsReturningVisitor(true);
    };
    window.addEventListener('skip-intro', handleSkip);
    return () => window.removeEventListener('skip-intro', handleSkip);
  }, []);

  const handleShopClick = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('ninoc_intro_played', 'true');
    setScene('transitioning');
    setTimeout(() => setScene('archive'), 1200);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${scene === 'archive' ? 'bg-white' : 'bg-[#e3e4e7]'}`}>
      <AnimatePresence>
        {(scene === 'hero' || scene === 'transitioning') && (
          <motion.div 
            className="fixed inset-0 z-[200] bg-[#e3e4e7] overflow-hidden h-[100dvh]"
            initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            animate={
              scene === 'transitioning' 
                ? { scale: 0.92, opacity: 0, filter: 'blur(10px)', y: -40 } 
                : { scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 }
            }
            transition={{ duration: 1.2, ease: EASING.inOut }}
          >
            {/* Top Horizontal Black Band */}
            <div className="absolute top-0 left-0 right-0 w-full h-8 md:h-10 bg-black z-[220] pointer-events-none" />

            {/* Bottom Horizontal Black Band */}
            <div className="absolute bottom-0 left-0 right-0 w-full h-8 md:h-10 bg-black z-[220] pointer-events-none" />

            {/* Interactive Mascot Video Motion State Engine */}
            <div className="absolute inset-0 w-full h-full">
              <InteractiveMascotVideo className="w-full h-full" />
            </div>
            <div className="absolute inset-0 h-full flex flex-col justify-between p-4 sm:p-6 md:p-12 z-10 text-ink pointer-events-none pt-safe pb-safe">
              {/* Header Navigation: Top Left Logo Forced to Far Left */}
              <div className="flex justify-between items-center w-full pointer-events-auto pt-2">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.2 }}
                  className="absolute left-4 sm:left-6 md:left-8 lg:left-10 xl:right-auto top-10 md:top-12 z-20 flex items-center gap-2.5 pointer-events-auto"
                >
                  <Image src="/logo.png" alt="NINOC Logo" width={120} height={120} className="w-9 h-9 md:w-12 md:h-12 object-contain" priority unoptimized />
                  <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest uppercase text-ink/50 border-l border-ink/10 pl-2.5">
                    STUDIO
                  </span>
                </motion.div>

                {/* Mobile Header Quick Action Pill */}
                <motion.div
                  className="flex md:hidden items-center absolute right-4 top-10"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.3 }}
                >
                  <button
                    onClick={handleShopClick}
                    className="no-drag pointer-events-auto flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-white/90 text-ink px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Skip Intro</span>
                    <ArrowRight size={13} className="text-[#8b5cf6]" />
                  </button>
                </motion.div>
              </div>

              {/* Main Content Area: Desktop Split Layout (Left Copy, Center Video, Right Vertical Navigation) */}
              <div className="flex flex-col justify-end md:justify-between flex-grow w-full max-w-[1800px] mx-auto py-2 md:py-12">
                
                {/* Desktop Content Section */}
                <div className="hidden md:flex flex-1 items-center justify-between my-auto">
                  
                  {/* Left Column: Brand Copy & CTA (Shifted Rightwards, Controlled Max-Width) */}
                  <div className="w-full max-w-md lg:max-w-[480px] xl:max-w-[520px] text-left pointer-events-auto space-y-4 sm:space-y-5 md:space-y-6 ml-8 sm:ml-16 md:ml-28 lg:ml-36 xl:ml-44">
                    
                    {/* Eyebrow / Overline */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
                      className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-[#64748b]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                      <span>NINOC® DESIGN & PRODUCTION STUDIO</span>
                    </motion.div>

                    {/* Primary Headline H1 */}
                    <motion.div 
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                      className="space-y-1"
                    >
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1e1b4b] tracking-tight leading-[1.08] font-sans">
                        Well-Made Things, <br />
                        Chosen Well
                      </h1>
                    </motion.div>

                    {/* Subtitle / Body Copy */}
                    <motion.p 
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.45 }}
                      className="text-xs sm:text-sm md:text-base text-[#475569] font-normal leading-relaxed max-w-sm sm:max-w-md md:max-w-lg"
                    >
                      Premium apparel, artisan objects, and specialty pantry curated under one roof.
                    </motion.p>

                    {/* Primary CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.6 }}
                      className="pt-2"
                    >
                      <motion.button
                        onClick={handleShopClick}
                        className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white px-8 py-3.5 rounded-full text-sm sm:text-base font-medium tracking-wide shadow-lg shadow-purple-500/25 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2"
                        whileHover={{ scale: 1.04, boxShadow: "0px 12px 28px rgba(168, 85, 247, 0.35)" }}
                        whileTap={{ scale: 0.97 }}
                        aria-label="Get Yours Now"
                      >
                        <span>Get Yours Now</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                      </motion.button>
                    </motion.div>

                  </div>

                  {/* Right Column: Vertical Navigation Menu (Regular Style & Smaller Size) */}
                  <motion.div 
                    className="hidden md:flex flex-col items-end gap-4 text-xs md:text-[11px] lg:text-xs font-mono font-normal uppercase tracking-[0.2em] text-ink/70 pointer-events-auto absolute right-4 sm:right-6 md:right-8 lg:right-10 xl:right-14 top-1/2 -translate-y-1/2 z-20"
                    initial={{ opacity: 0, x: 40 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.4 }}
                  >
                    <span className="text-[10px] font-mono font-normal tracking-[0.25em] uppercase text-ink/40 mb-1 border-b border-ink/10 pb-1.5 w-full text-right">
                      CATEGORIES
                    </span>
                    <button onClick={handleShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Apparel</button>
                    <button onClick={handleShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Objects</button>
                    <button onClick={handleShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Pantry</button>
                    <button onClick={handleShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Logbook</button>
                    <button onClick={handleShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">About</button>
                  </motion.div>

                </div>

                {/* Mobile Viewport Polish: Frosted Liquid-Glass Floating Card */}
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
                  className="flex md:hidden flex-col pointer-events-auto bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-3xl p-5 space-y-3.5 mb-14 mx-1"
                >
                  {/* Mobile Eyebrow */}
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#64748b]">
                    <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
                    <span>NINOC® DESIGN STUDIO</span>
                  </div>

                  {/* Mobile Headline */}
                  <h1 className="text-2xl font-extrabold text-[#1e1b4b] tracking-tight leading-snug">
                    Well-Made Things, <br />
                    Chosen Well
                  </h1>

                  {/* Mobile Body Copy */}
                  <p className="text-xs text-[#475569] font-normal leading-relaxed">
                    Premium apparel, artisan objects, and specialty pantry curated under one roof.
                  </p>

                  {/* Mobile Full-Width CTA */}
                  <div className="pt-1">
                    <motion.button
                      onClick={handleShopClick}
                      className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white py-3.5 rounded-2xl text-sm font-semibold tracking-wide shadow-lg shadow-purple-500/25 cursor-pointer active:scale-[0.98] transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      aria-label="Get Yours Now"
                    >
                      <span>Get Yours Now</span>
                      <ArrowRight size={16} />
                    </motion.button>
                  </div>

                  {/* Mobile Footer Meta */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-[#94a3b8] font-medium">
                    <span>EST. 2024 · BDG ID</span>
                    <div className="flex gap-3 text-[#64748b]">
                      <a href="https://instagram.com/ninoc.store" target="_blank" rel="noopener noreferrer" className="hover:text-[#8b5cf6] transition-colors" aria-label="Instagram">
                        Instagram
                      </a>
                      <span>·</span>
                      <a href="https://tiktok.co.id/ninocenterprise" target="_blank" rel="noopener noreferrer" className="hover:text-[#8b5cf6] transition-colors" aria-label="TikTok">
                        TikTok
                      </a>
                      <span>·</span>
                      <a href="mailto:ninocenterprise@gmail.com" className="hover:text-[#8b5cf6] transition-colors" aria-label="Email">
                        Email
                      </a>
                    </div>
                  </div>
                </motion.div>

                {/* Bottom Bar: Left Spec Badge & Right Social Footer (Desktop Only - Elevated Above Bottom Black Band) */}
                <div className="hidden md:flex items-center justify-between pointer-events-auto px-4 sm:px-8 md:px-12 lg:px-16 pb-4 pt-2 z-20">
                  {/* Bottom Left Spec Meta (Elevated above bottom black band) */}
                  <div className="text-[10px] font-mono tracking-widest text-[#94a3b8] uppercase absolute left-4 sm:left-6 md:left-8 lg:left-10 xl:left-12 bottom-12 md:bottom-14 lg:bottom-16">
                    EST. 2024 · BANDUNG ID
                  </div>

                  {/* Bottom Right Social Links (Instagram, TikTok, Email) */}
                  <div className="hidden md:flex flex-col items-end absolute right-4 sm:right-6 md:right-8 lg:right-10 xl:right-14 bottom-12 md:bottom-14 lg:bottom-16 z-20">
                    <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#94a3b8] uppercase mb-1">Follow ninoc</p>
                    <div className="flex items-center gap-3 text-[#64748b]">
                      {/* Instagram */}
                      <a href="https://instagram.com/ninoc.store" target="_blank" rel="noopener noreferrer" className="hover:text-[#8b5cf6] transition-colors p-1" aria-label="Instagram">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                      </a>
                      {/* TikTok */}
                      <a href="https://tiktok.co.id/ninocenterprise" target="_blank" rel="noopener noreferrer" className="hover:text-[#8b5cf6] transition-colors p-1" aria-label="TikTok">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.63a6.34 6.34 0 0 0-5.11 6.17 6.34 6.34 0 1 0 11.45-3.69V8.65a8.28 8.28 0 0 0 4.77 1.49V6.69z"/></svg>
                      </a>
                      {/* Email */}
                      <a href="mailto:ninocenterprise@gmail.com" className="hover:text-[#8b5cf6] transition-colors p-1" aria-label="Email">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(scene === 'archive' || scene === 'transitioning') && (
          <motion.div
            className="w-full min-h-screen bg-white relative z-40"
            initial={isReturningVisitor ? false : { opacity: 0, scale: 0.95, y: 60 }}
            animate={{ 
              opacity: scene === 'archive' || scene === 'transitioning' ? 1 : 0,
              scale: scene === 'archive' || scene === 'transitioning' ? 1 : 0.95,
              y: scene === 'archive' || scene === 'transitioning' ? 0 : 60 
            }}
            transition={{ duration: isReturningVisitor ? 0.3 : 1.2, ease: EASING.inOut, delay: isReturningVisitor ? 0 : 0.1 }}
          >
             <div className="mobile-momentum">
                <HeroSequence dict={dict} isReturningVisitor={isReturningVisitor} scene={scene} />
                <DynamicBanner />
                <HomeProductSlider products={products} isLoading={false} />
                <BrandPhilosophy />
                <BentoDepartmentGrid />
                <ConnectSection />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
