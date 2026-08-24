"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import HeroSequence from './HeroSequence';
import { DynamicBanner } from '@/components/home/DynamicBanner';
import HomeProductSlider from './HomeProductSlider';
import BentoDepartmentGrid from './BentoDepartmentGrid';
import BrandPhilosophy from './BrandPhilosophy';
import ConnectSection from './ConnectSection';
import InteractiveMascotVideo from '@/components/mascot/InteractiveMascotVideo';
import { EASING, DURATION } from '@/lib/animations';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  slug: string;
  category?: any;
  price_tag?: string | null;
}

interface HomeClientWrapperProps {
  products: Product[];
  dict: any;
}

/**
 * MobileIntroCard Component
 * Isolated liquid-glass mobile floating card (10% opacity)
 * Fades in upon initial user touch and provides CTA to navigate to shop.
 */
function MobileIntroCard({
  isTouched,
  onShopClick,
}: {
  isTouched: boolean;
  onShopClick: (e?: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.85 }}
      animate={isTouched ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.85 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className={`flex md:hidden flex-col bg-white/5 backdrop-blur-md border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-3xl p-4 space-y-2.5 mb-5 sm:mb-6 mx-1 ${
        isTouched ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
      }`}
    >
      {/* Mobile Eyebrow */}
      <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#64748b]">
        <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
        <span>NINOC® DESIGN STUDIO</span>
      </div>

      {/* Mobile Headline */}
      <h1 className="text-xl font-extrabold text-[#1e1b4b] tracking-tight leading-snug">
        Well-Made Things, Chosen Well
      </h1>

      {/* Mobile Body Copy */}
      <p className="text-xs text-[#475569] font-normal leading-relaxed">
        Premium apparel, artisan objects, and specialty pantry curated under one roof.
      </p>

      {/* Mobile Full-Width CTA */}
      <div className="pt-0.5">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onShopClick();
          }}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white py-2.5 rounded-2xl text-xs font-semibold tracking-wide shadow-lg shadow-purple-500/25 cursor-pointer active:scale-[0.98] transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Get Yours Now"
        >
          <span>Get Yours Now</span>
          <ArrowRight size={15} />
        </motion.button>
      </div>

      {/* Mobile Footer Meta */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px] text-[#64748b] font-medium">
        <span>EST. 2024 · BDG ID</span>
        <div className="flex gap-2 text-[#64748b]">
          <a
            href="https://instagram.com/ninoc.co"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-[#8b5cf6] transition-colors"
            aria-label="Instagram"
          >
            Instagram
          </a>
          <span>·</span>
          <a
            href="https://tiktok.co.id/ninocenterprise"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-[#8b5cf6] transition-colors"
            aria-label="TikTok"
          >
            TikTok
          </a>
          <span>·</span>
          <a
            href="mailto:ninocenterprise@gmail.com"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-[#8b5cf6] transition-colors"
            aria-label="Email"
          >
            Email
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * DesktopIntroOverlay Component
 * Always active and visible on Desktop, Laptop, and Tablet viewports.
 */
function DesktopIntroOverlay({ onShopClick }: { onShopClick: () => void }) {
  return (
    <>
      <div className="hidden md:flex flex-1 items-center justify-between my-auto pointer-events-auto">
        {/* Left Column: Brand Copy & CTA */}
        <div className="w-full max-w-md lg:max-w-[480px] xl:max-w-[520px] text-left pointer-events-auto space-y-4 sm:space-y-5 md:space-y-6 ml-4 sm:ml-8 md:ml-12 lg:ml-20 xl:ml-28 2xl:ml-36">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-[#475569]"
          >
            <span className="w-2 h-2 rounded-full bg-[#8b5cf6] shadow-sm shadow-purple-500/50" />
            <span>NINOC® DESIGN & PRODUCTION STUDIO</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
            className="space-y-1"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#0f172a] tracking-tight leading-[1.08] font-sans drop-shadow-2xs">
              Well-Made Things, <br />
              Chosen Well
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.45 }}
            className="text-xs sm:text-sm md:text-base text-[#334155] font-medium leading-relaxed max-w-sm sm:max-w-md md:max-w-lg"
          >
            Premium apparel, artisan objects, and specialty pantry curated under one roof.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.6 }}
            className="pt-2"
          >
            <motion.button
              onClick={onShopClick}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white px-8 py-3.5 rounded-full text-sm sm:text-base font-bold tracking-wide shadow-lg shadow-purple-500/30 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2"
              whileHover={{ scale: 1.04, boxShadow: "0px 14px 32px rgba(168, 85, 247, 0.45)" }}
              whileTap={{ scale: 0.97 }}
              aria-label="Get Yours Now"
            >
              <span>Get Yours Now</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </motion.div>
        </div>

        {/* Right Column: Vertical Navigation Menu */}
        <motion.div
          className="hidden md:flex flex-col items-end gap-4 text-xs md:text-[11px] lg:text-xs font-mono font-bold uppercase tracking-[0.2em] text-ink/80 pointer-events-auto absolute right-4 sm:right-6 md:right-8 lg:right-10 xl:right-14 top-1/2 -translate-y-1/2 z-20"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.4 }}
        >
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-ink/60 mb-1 border-b border-ink/15 pb-1.5 w-full text-right">
            CATEGORIES
          </span>
          <button onClick={onShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Apparel</button>
          <button onClick={onShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Objects</button>
          <button onClick={onShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Pantry</button>
          <button onClick={onShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">Logbook</button>
          <button onClick={onShopClick} className="hover:text-[#8b5cf6] hover:translate-x-[-4px] transition-all cursor-pointer">About</button>
        </motion.div>
      </div>

      {/* Bottom Bar: Left Spec Badge & Right Social Footer */}
      <div className="hidden md:flex items-center justify-between pointer-events-auto px-4 sm:px-8 md:px-12 lg:px-16 pb-4 pt-2 z-20">
        <div className="text-[10px] font-mono tracking-widest text-[#94a3b8] uppercase absolute left-4 sm:left-6 md:left-8 lg:left-10 xl:left-12 bottom-12 md:bottom-14 lg:bottom-16">
          EST. 2024 · BANDUNG ID
        </div>

        <div className="hidden md:flex flex-col items-end absolute right-4 sm:right-6 md:right-8 lg:right-10 xl:right-14 bottom-12 md:bottom-14 lg:bottom-16 z-20">
          <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#94a3b8] uppercase mb-1">Follow ninoc</p>
          <div className="flex items-center gap-3 text-[#64748b]">
            <a href="https://instagram.com/ninoc.co" target="_blank" rel="noopener noreferrer" className="hover:text-[#8b5cf6] transition-colors p-1" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://tiktok.co.id/ninocenterprise" target="_blank" rel="noopener noreferrer" className="hover:text-[#8b5cf6] transition-colors p-1" aria-label="TikTok">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.63a6.34 6.34 0 0 0-5.11 6.17 6.34 6.34 0 1 0 11.45-3.69V8.65a8.28 8.28 0 0 0 4.77 1.49V6.69z"/></svg>
            </a>
            <a href="mailto:ninocenterprise@gmail.com" className="hover:text-[#8b5cf6] transition-colors p-1" aria-label="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function HomeClientWrapper({ products, dict }: HomeClientWrapperProps) {
  const [scene, setScene] = useState<'hero' | 'transitioning' | 'archive'>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('ninoc_intro_played') === 'true') {
      return 'archive';
    }
    return 'hero';
  });
  const [isReturningVisitor, setIsReturningVisitor] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('ninoc_intro_played') === 'true') {
      return true;
    }
    return false;
  });
  const [isTouched, setIsTouched] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleShopClick = useCallback(() => {
    if (typeof window !== 'undefined') sessionStorage.setItem('ninoc_intro_played', 'true');
    setScene('transitioning');
    setTimeout(() => setScene('archive'), 1200);
  }, []);

  const handleOverlayTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isTouched) {
      e.stopPropagation();
      setIsTouched(true);
    }
  }, [isTouched]);

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
                ? { scale: 0.85, opacity: 0, filter: 'blur(8px)' } 
                : { scale: 1, opacity: 1, filter: 'blur(0px)' }
            }
            transition={{ duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Mascot Video Container */}
            <div 
              onClick={handleOverlayTap}
              onTouchStart={handleOverlayTap}
              className="absolute inset-0 w-full h-full cursor-pointer"
            >
              <motion.div
                className="w-full h-full"
                style={{ scale: mounted && isMobile ? 0.93 : 1 }}
                animate={mounted && isMobile ? { 
                  y: [0, -12, 0] 
                } : {}}
                transition={mounted && isMobile ? {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <InteractiveMascotVideo className="w-full h-full" />
              </motion.div>
            </div>

            {/* Overlay Layer (Logo & Content Card) */}
            <div 
              onClick={handleOverlayTap}
              onTouchStart={handleOverlayTap}
              className="absolute inset-0 h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-12 z-10 text-ink pointer-events-auto cursor-pointer pt-safe pb-safe"
            >
              {/* Header Logo */}
              <div className="flex justify-between items-center w-full pt-1">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={
                    (mounted && isMobile)
                      ? (isTouched ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 })
                      : { opacity: 1, y: 0 }
                  }
                  transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.2 }}
                  className="absolute left-4 sm:left-6 md:left-8 lg:left-12 top-4 md:top-6 z-20 flex items-center gap-2.5"
                >
                  <Image src="/logo.png" alt="NINOC Logo" width={120} height={120} className="w-8 h-8 md:w-10 md:h-10 object-contain" priority unoptimized />
                </motion.div>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-col justify-end md:justify-between flex-grow w-full max-w-[1800px] mx-auto py-2 md:py-12">
                <DesktopIntroOverlay onShopClick={handleShopClick} />
                <MobileIntroCard isTouched={isTouched} onShopClick={handleShopClick} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(scene === 'archive' || scene === 'transitioning') && (
          <motion.div
            className="w-full min-h-screen bg-white relative z-40"
            initial={isReturningVisitor ? false : { opacity: 0, y: 20 }}
            animate={{ 
              opacity: scene === 'archive' || scene === 'transitioning' ? 1 : 0,
              y: scene === 'archive' || scene === 'transitioning' ? 0 : 20 
            }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
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

