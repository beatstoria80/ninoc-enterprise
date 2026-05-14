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

    // Only show if page is actually scrollable (content taller than viewport + 50px buffer)
    const hasScroll = docHeight > winHeight + 50;
    setIsVisible(hasScroll);

    // Flip direction: if user scrolled past 300px → show "up"
    setScrollDirection(scrollY > 300 ? 'up' : 'down');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkScroll();
    
    // Also check after a short delay to ensure DOM has settled
    const timer = setTimeout(checkScroll, 1000);
    
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleClick = () => {
    if (scrollDirection === 'down') {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
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
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex fixed right-3 top-1/2 -translate-y-1/2 z-[999] flex-col items-center group cursor-pointer"
          aria-label={scrollDirection === 'down' ? 'Scroll down' : 'Back to top'}
        >
          <motion.div
            animate={{ y: scrollDirection === 'down' ? [0, 3, 0] : [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-5 h-9 rounded-full border border-ink/20 group-hover:border-rose/60 bg-white/90 backdrop-blur-md flex items-center justify-center transition-colors duration-300 shadow-md"
          >
            <motion.div
              animate={
                scrollDirection === 'down'
                  ? { y: [0, 5, 0], opacity: [1, 0.2, 1] }
                  : { y: [0, -5, 0], opacity: [1, 0.2, 1] }
              }
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-[3px] h-2 rounded-full bg-ink/20 group-hover:bg-rose transition-colors duration-300"
            />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
