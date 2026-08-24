"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function GlobalCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 22, stiffness: 350, mass: 0.4 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  // Trailing ring (follows with more lag for organic feel)
  const trailConfig = { damping: 30, stiffness: 180, mass: 0.8 };
  const trailX = useSpring(mouseX, trailConfig);
  const trailY = useSpring(mouseY, trailConfig);

  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard');

  useEffect(() => {
    // Nonaktifkan custom cursor di area admin dashboard untuk menghindari lag (loncat-loncat)
    // dan mengembalikan hardware cursor bawaan agar lebih responsif.
    if (isDashboardRoute) return;

    // Only run on desktop/devices with a precise mouse
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // Defer state update to avoid cascading render warning
    const timeout = setTimeout(() => setIsVisible(true), 0);

    const handleMouseMove = (e: MouseEvent) => {
      if (document.documentElement.classList.contains('drawer-open')) return;
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.classList?.contains('cursor-pointer') ||
        target.closest('.cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    // Hide native cursor for interactive elements globally by injecting CSS
    const style = document.createElement('style');
    style.innerHTML = `
      html:not(.drawer-open) * { cursor: none !important; }
      html.drawer-open * { cursor: auto !important; }
      html:not(.drawer-open) input, html:not(.drawer-open) textarea, html:not(.drawer-open) [contenteditable="true"] { cursor: text !important; }
      html.drawer-open #ninoc-global-cursor { display: none !important; }
      html.drawer-open #ninoc-cursor-trail { display: none !important; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      clearTimeout(timeout);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [mouseX, mouseY, isDashboardRoute]);

  if (isDashboardRoute || !isVisible) return null;

  return (
    <>
      {/* Outer trailing ring — soft glow that follows with lag */}
      <motion.div
        id="ninoc-cursor-trail"
        className="pointer-events-none fixed top-0 left-0 z-[999998] rounded-full"
        style={{
          x: trailX,
          y: trailY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 56 : 32,
          height: isHovering ? 56 : 32,
          opacity: isHovering ? 0.5 : 0.2,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: isHovering
              ? 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.05) 60%, transparent 100%)'
              : 'radial-gradient(circle, rgba(15,23,42,0.08) 0%, transparent 70%)',
            transition: 'background 0.3s ease',
          }}
        />
      </motion.div>

      {/* Main cursor — ring/circle outline */}
      <motion.div
        id="ninoc-global-cursor"
        className="pointer-events-none fixed top-0 left-0 z-[999999] flex items-center justify-center rounded-full"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 48 : 10,
          height: isHovering ? 48 : 10,
          borderWidth: isHovering ? 1.5 : 0,
          borderColor: isHovering ? 'rgba(139, 92, 246, 0.6)' : 'transparent',
          backgroundColor: isHovering ? 'rgba(139, 92, 246, 0.06)' : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: isHovering ? 'blur(12px)' : 'blur(0px)',
          boxShadow: isHovering
            ? '0 0 20px rgba(139,92,246,0.15), inset 0 0 12px rgba(139,92,246,0.06)'
            : '0 1px 3px rgba(0,0,0,0.12)',
        }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        {/* Inner dot visible on hover for precise pointer feedback */}
        <motion.div
          className="rounded-full"
          animate={{
            width: isHovering ? 4 : 0,
            height: isHovering ? 4 : 0,
            opacity: isHovering ? 0.8 : 0,
            backgroundColor: 'rgba(139, 92, 246, 0.9)',
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        />
      </motion.div>
    </>
  );
}
