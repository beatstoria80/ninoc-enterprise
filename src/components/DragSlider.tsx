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

    // Lock body scroll during touch drag — prevents mobile vertical page scroll lag
    const lockBody = () => {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    };
    const unlockBody = () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };

    // ── PC POINTER DRAG (non-touch pointer types) ──────────────
    const onDown = (e: Event) => {
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return; // let native touch handle it
      ev.preventDefault();
      dragRef.current = { active: true, startX: ev.clientX, startScroll: el.scrollLeft };
      document.body.style.userSelect = 'none';
    };

    const onMove = (e: Event) => {
      if (!dragRef.current.active) return;
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return;
      ev.preventDefault();
      const delta = ev.clientX - dragRef.current.startX;
      const maxScroll = -(el.scrollWidth - el.offsetWidth);
      el.scrollLeft = Math.max(maxScroll, Math.min(0, dragRef.current.startScroll - delta));
    };

    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      document.body.style.userSelect = '';
    };

    // ── MOBILE NATIVE TOUCH HANDLERS ───────────────────────────
    // These bypass React entirely — prevents page scroll lag on mobile
    let startTouchX = 0;
    let startScroll = 0;
    let isDragging = false;

    const onTouchStart = (e: TouchEvent) => {
      // Only lock if touch starts inside this slider
      const touch = e.touches[0];
      const rect = el.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        e.preventDefault();
        lockBody();
        isDragging = true;
        startTouchX = touch.clientX;
        startScroll = el.scrollLeft;
        dragRef.current = { active: true, startX: touch.clientX, startScroll: el.scrollLeft };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const delta = touch.clientX - startTouchX;
      const maxScroll = -(el.scrollWidth - el.offsetWidth);
      el.scrollLeft = Math.max(maxScroll, Math.min(0, startScroll - delta));
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      dragRef.current.active = false;
      unlockBody();
    };

    // ── ATTACH HANDLERS ────────────────────────────────────────
    // Pointer events (capture phase) — PC only
    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('pointermove', onMove, true);
    el.addEventListener('pointerup', onUp, true);
    el.addEventListener('pointercancel', onUp, true);
    el.addEventListener('mousedown', onDown, true);
    el.addEventListener('mousemove', onMove, true);
    el.addEventListener('mouseup', onUp, true);
    el.addEventListener('mouseleave', onUp, true);

    // Native touch events — mobile only, bypass React entirely
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('pointermove', onMove, true);
      el.removeEventListener('pointerup', onUp, true);
      el.removeEventListener('pointercancel', onUp, true);
      el.removeEventListener('mousedown', onDown, true);
      el.removeEventListener('mousemove', onMove, true);
      el.removeEventListener('mouseup', onUp, true);
      el.removeEventListener('mouseleave', onUp, true);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      unlockBody();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto no-scrollbar ${className}`}
      style={{
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        touchAction: 'pan-x',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {children}
    </div>
  );
}