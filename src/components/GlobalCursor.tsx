"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function GlobalCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

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
        width: isHovering ? 48 : 12,
        height: isHovering ? 48 : 12,
        backgroundColor: isHovering ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.9)', // 5% white on hover, dark ink on default
        backdropFilter: isHovering ? 'blur(8px)' : 'blur(0px)',
        border: isHovering ? '1px solid rgba(15, 23, 42, 0.2)' : '0px solid transparent',
        boxShadow: isHovering ? 'inset 0 0 15px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 1px 2px 0 rgba(0,0,0,0.05)'
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    />
  );
}
