"use client";

import React, { useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// DRAG SLIDER — PC Mouse Drag via Native addEventListener Capture
// Formula: scrollLeft = startScroll - delta  (delta = currentX - startX)
// Mobile works because touch bypasses React synthetic events
// PC fails because Framer Motion intercepts pointer/mouse events first
// Fix: use capture phase addEventListener on mount, bypass React entirely
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

    // onDown — capture start position, disable text selection
    const onDown = (e: Event) => {
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return; // Allow native touch behavior
      
      ev.preventDefault();
      dragRef.current = {
        active: true,
        startX: ev.clientX,
        startScroll: el.scrollLeft,
      };
      document.body.style.userSelect = 'none';
    };

    // onMove — calculate delta, apply scrollLeft
    const onMove = (e: Event) => {
      if (!dragRef.current.active) return;
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return;
      
      ev.preventDefault();
      const delta = ev.clientX - dragRef.current.startX;
      const maxScroll = -(el.scrollWidth - el.offsetWidth);
      el.scrollLeft = Math.max(maxScroll, Math.min(0, dragRef.current.startScroll - delta));
    };

    // onUp — reset drag state
    const onUp = () => {
      dragRef.current.active = false;
      document.body.style.userSelect = '';
    };

    // Attach with capture phase — intercepts BEFORE React synthetic events
    // Mobile: touch events work because touch doesn't go through React delegation
    // PC: pointer/mouse events go through React delegation first, then Framer Motion
    // Capture phase fires before bubble, so we intercept before Framer Motion sees it
    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('pointermove', onMove, true);
    el.addEventListener('pointerup', onUp, true);
    el.addEventListener('pointercancel', onUp, true);
    el.addEventListener('mousedown', onDown, true);
    el.addEventListener('mousemove', onMove, true);
    el.addEventListener('mouseup', onUp, true);
    el.addEventListener('mouseleave', onUp, true);

    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('pointermove', onMove, true);
      el.removeEventListener('pointerup', onUp, true);
      el.removeEventListener('pointercancel', onUp, true);
      el.removeEventListener('mousedown', onDown, true);
      el.removeEventListener('mousemove', onMove, true);
      el.removeEventListener('mouseup', onUp, true);
      el.removeEventListener('mouseleave', onUp, true);
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
        touchAction: 'pan-x', // mobile: only allow horizontal pan, block vertical page scroll
        ...style,
      }}
    >
      {children}
    </div>
  );
}