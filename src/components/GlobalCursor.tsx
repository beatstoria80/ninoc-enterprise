"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

export default function GlobalCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    // Only run on desktop/devices with a precise mouse
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // Defer state update to avoid cascading render warning
    const timeout = setTimeout(() => setIsVisible(true), 0);

    const handleMouseMove = (e: MouseEvent) => {
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
      * { cursor: none !important; }
      input, textarea, [contenteditable="true"] { cursor: text !important; }
      .cursor-none { cursor: none !important; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      clearTimeout(timeout);
      document.head.removeChild(style);
    };
  }, [mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <motion.div
      className={`pointer-events-none fixed top-0 left-0 z-[99999] flex items-center justify-center rounded-full transition-all duration-300 ${
        isHovering
          ? 'bg-white/20 backdrop-blur-md mix-blend-difference border border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] shadow-2xl'
          : 'bg-white/80 backdrop-blur-sm mix-blend-difference'
      }`}
      style={{
        x: mouseX,
        y: mouseY,
        translateX: '-50%',
        translateY: '-50%',
        willChange: 'transform, width, height'
      }}
      animate={{
        width: isHovering ? 48 : 12,
        height: isHovering ? 48 : 12,
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    />
  );
}
