"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, PanInfo } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function ScrollCapsule() {
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll();
  
  // Map scroll progress (0-1) to vertical position (15% to 85% of screen)
  const yProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const yPos = useTransform(yProgress, [0, 1], ["15vh", "85vh"]);

  const checkScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;

    const hasScroll = docHeight > winHeight + 10;
    setIsVisible(hasScroll);
    
    // Flip direction to "up" only when passed 60% of the page
    setScrollDirection(scrollY > docHeight * 0.6 ? 'up' : 'down');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkScroll();
    const interval = setInterval(checkScroll, 1000);
    const timeout = setTimeout(() => clearInterval(interval), 5000);
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleClick = () => {
    const scrollY = window.scrollY;
    const catalogEl = document.getElementById('archive-catalog');
    
    if (scrollY < 100 && catalogEl) {
      // From Slide 1 to Slide 2 (New Releases) - Aligned to CENTER
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Return to Top directly from anywhere else (Slide 2 or beyond)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDrag = (_: unknown, info: PanInfo) => {
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;
    
    // Calculate progress based on vertical position (15vh to 85vh)
    const trackStart = winHeight * 0.15;
    const trackEnd = winHeight * 0.85;
    const trackLength = trackEnd - trackStart;
    
    // Get current y relative to viewport
    const currentY = info.point.y;
    const progress = Math.max(0, Math.min(1, (currentY - trackStart) / trackLength));
    
    window.scrollTo({ top: progress * maxScroll, behavior: 'auto' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="hidden md:block fixed inset-y-0 right-0 w-16 z-[9999] pointer-events-none" ref={containerRef}>
          <motion.div
            key="global-scroll-capsule"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ 
              y: yPos,
              pointerEvents: 'auto',
            }}
            className="absolute right-4 md:right-5 flex flex-col items-center gap-3"
          >
            <motion.button 
              onClick={handleClick}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0}
              onDrag={handleDrag}
              className="w-7 h-20 rounded-full border border-ink/10 bg-white/40 backdrop-blur-md flex items-center justify-center group hover:border-rose/20 transition-all duration-500 cursor-grab active:cursor-grabbing"
            >
              <motion.div
                animate={{ rotate: scrollDirection === 'down' ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ArrowDown size={14} className="text-ink/40 group-hover:text-rose transition-colors" />
              </motion.div>
            </motion.button>

            <div className="flex flex-col items-center gap-1.5 opacity-30">
              <span className="text-[7px] font-medium uppercase tracking-[0.4em] [writing-mode:vertical-rl] transform rotate-180 select-none">
                {scrollDirection === 'down' ? 'Archive Explore' : 'Return Origin'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
