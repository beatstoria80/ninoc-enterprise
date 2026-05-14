"use client";

import React, { useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// DRAG SLIDER — PC mouse + Mobile touch drag
// Mobile: body scroll-lock on touchstart prevents page lag/freeze
// PC: pointer capture phase bypasses Framer Motion interference
// ═══════════════════════════════════════════════════════════════

interface DragSliderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function DragSlider({ children, className = '', style = {} }: DragSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── PC POINTER DRAG (Mouse only) ──────────────
    // We only intercept pointer events if they are NOT touch-based.
    // This allows native touch scrolling on mobile while enabling mouse drag on PC.
    const onDown = (e: Event) => {
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return; 
      
      dragRef.current = { active: true, startX: ev.clientX, startScroll: el.scrollLeft };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    };

    const onMove = (e: Event) => {
      if (!dragRef.current.active) return;
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return;
      
      const delta = ev.clientX - dragRef.current.startX;
      el.scrollLeft = dragRef.current.startScroll - delta;
    };

    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    // Attach capture-phase listeners to bypass interference
    el.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto no-scrollbar ${className}`}
      style={{
        cursor: 'grab',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {children}
    </div>
  );
}