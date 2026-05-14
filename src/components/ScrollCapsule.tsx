"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Global Scroll Capsule — a micro scroll-position indicator fixed at the
 * far-right edge of the viewport (desktop only). Replaces the traditional
 * scrollbar with a minimal, branded capsule.
 *
 * - At the top of the page: arrow points DOWN (scroll to explore).
 * - After scrolling: arrow points UP (back to top).
 * - Clicking scrolls smoothly in the indicated direction.
 * - Auto-hides when the page has no meaningful scroll depth.
 */
export default function ScrollCapsule() {
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [isVisible, setIsVisible] = useState(false);

  const checkScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;

    // Show if page is scrollable by even a small amount
    const hasScroll = docHeight > winHeight + 2;
    setIsVisible(hasScroll);

    // Flip direction: if user scrolled past 300px → show "up"
    setScrollDirection(scrollY > 300 ? 'up' : 'down');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkScroll();
    
    // Polling height for the first 5 seconds to handle dynamic content/images loading
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          key="global-scroll-capsule"
          onClick={handleClick}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-[9999] flex-col items-center group cursor-pointer"
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
      )}
    </AnimatePresence>
  );
}
