"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';

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
    setScrollDirection(scrollY > 300 ? 'up' : 'down');
  }, []);

  useEffect(() => {
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
    if (scrollDirection === 'down') {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDrag = (_: any, info: any) => {
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
        <div className="hidden md:block fixed inset-y-0 right-0 w-20 z-[9999] pointer-events-none" ref={containerRef}>
          <motion.button
            key="global-scroll-capsule"
            onClick={handleClick}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }} // We use onDrag for custom logic
            dragElastic={0}
            onDrag={handleDrag}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ 
              y: yPos,
              pointerEvents: 'auto',
              x: 0
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-8 flex flex-col items-center group cursor-grab active:cursor-grabbing"
            aria-label={scrollDirection === 'down' ? 'Scroll down' : 'Back to top'}
          >
            <motion.div
              animate={{ y: scrollDirection === 'down' ? [0, 4, 0] : [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="w-6 h-10 rounded-full border-2 border-ink/20 group-hover:border-rose/70 bg-white/95 backdrop-blur-md flex items-center justify-center transition-colors duration-300 shadow-xl"
            >
              <motion.div
                animate={
                  scrollDirection === 'down'
                    ? { y: [0, 6, 0], opacity: [1, 0.3, 1] }
                    : { y: [0, -6, 0], opacity: [1, 0.3, 1] }
                }
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="w-[3px] h-2.5 rounded-full bg-ink/40 group-hover:bg-rose transition-colors duration-300"
              />
            </motion.div>
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
