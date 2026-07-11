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
  direction?: 'horizontal' | 'vertical';
}

export default function DragSlider({ children, className = '', style = {}, direction = 'horizontal' }: DragSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ 
    active: false, 
    isDragging: false, 
    wasDragging: false, 
    start: 0, 
    startScroll: 0 
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── PC POINTER DRAG (Mouse only) ──────────────
    const onDown = (e: Event) => {
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return; 
      
      dragRef.current = { 
        ...dragRef.current,
        active: true, 
        isDragging: false,
        wasDragging: false,
        start: direction === 'horizontal' ? ev.clientX : ev.clientY, 
        startScroll: direction === 'horizontal' ? el.scrollLeft : el.scrollTop 
      };
    };

    const onMove = (e: Event) => {
      if (!dragRef.current.active) return;
      const ev = e as PointerEvent;
      if (ev.pointerType === 'touch') return;
      
      const currentPos = direction === 'horizontal' ? ev.clientX : ev.clientY;
      const delta = currentPos - dragRef.current.start;
      
      // Threshold check to distinguish between a click and a drag
      if (!dragRef.current.isDragging) {
        if (Math.abs(delta) > 5) {
          dragRef.current.isDragging = true;
          dragRef.current.wasDragging = true;
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'grabbing';
        } else {
          return;
        }
      }
      
      if (direction === 'horizontal') {
        el.scrollLeft = dragRef.current.startScroll - delta;
      } else {
        el.scrollTop = dragRef.current.startScroll - delta;
      }
    };

    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Reset wasDragging after allowing the click handler to catch it
        setTimeout(() => {
          dragRef.current.wasDragging = false;
        }, 50);
      }
    };

    // Click interceptor to prevent "Ghost Clicks" (accidental navigation)
    const onClick = (e: Event) => {
      if (dragRef.current.wasDragging) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.wasDragging = false; // Consume the flag
      }
    };

    // Attach capture-phase listeners
    el.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick, true); // Capture phase click interception

    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick, true);
    };
  }, [direction]);

  return (
    <div
      ref={containerRef}
      className={`${direction === 'horizontal' ? 'overflow-x-auto' : 'overflow-y-auto'} no-scrollbar no-drag ${className}`}
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