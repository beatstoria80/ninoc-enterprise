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

import InteractiveMascotVideo from '@/components/mascot/InteractiveMascotVideo';

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
    <div className={`relative min-h-screen overflow-hidden ${scene === 'archive' ? 'bg-white' : 'bg-white'}`}>
      <AnimatePresence>
        {(scene === 'hero' || scene === 'transitioning') && (
          <motion.div 
            className="fixed inset-0 z-[200] bg-white overflow-hidden h-[100dvh]"
            initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            animate={
              scene === 'transitioning' 
                ? { scale: 0.92, opacity: 0, filter: 'blur(10px)', y: -40 } 
                : { scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 }
            }
            transition={{ duration: 1.2, ease: EASING.inOut }}
          >
            {/* Interactive Mascot Video Motion State Engine */}
            <div className="absolute inset-0 w-full h-full">
              <InteractiveMascotVideo className="w-full h-full" />
            </div>
            
            <div className="absolute inset-0 h-full flex flex-col justify-between p-6 md:p-12 z-10 text-ink pointer-events-none">
              <div className="flex justify-between items-center w-full pointer-events-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.2 }}>
                  <Image src="/logo.png" alt="NINOC Logo" width={120} height={120} className="w-10 h-10 md:w-12 md:h-12 object-contain" priority unoptimized />
                </motion.div>
                
                <motion.div className="hidden md:flex gap-8 text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/70" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.3 }}>
                  <span>Apparel</span><span>Objects</span><span>Pantry</span><span>Logbook</span><span>About</span>
                </motion.div>
                
                <motion.div className="flex gap-4 text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/70" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.slow, ease: EASING.out, delay: 0.4 }}>
                  <span>Search</span><span className="hidden md:inline">Account</span><span>Cart(0)</span>
                </motion.div>
              </div>

              <div className="flex flex-col items-center justify-end flex-grow text-center pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-24 pointer-events-auto">
                <motion.button
                  onClick={handleShopClick}
                  className="bg-ink text-white px-10 py-4 text-sm font-medium uppercase tracking-[0.3em] transition-all relative cursor-pointer shadow-xl shadow-ink/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, y: 0, scale: [1, 1.05, 1],
                    boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 20px rgba(0,0,0,0.2)", "0px 0px 0px rgba(0,0,0,0)"]
                  }}
                  transition={{
                    opacity: { duration: 1, delay: 0.5 },
                    y: { duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.5 },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
                  }}
                  whileHover={{ scale: 1.08, backgroundColor: "#e11d48" }}
                  whileTap={{ scale: 0.97 }}
                >
                  GET YOURS
                </motion.button>
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
