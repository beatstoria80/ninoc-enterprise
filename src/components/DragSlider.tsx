"use client";

import React, { useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// DRAG SLIDER — Pure JS Mouse Drag to Scroll
// Formula: scrollLeft = startScroll - delta  (delta = currentX - startX)
// useRef for performance (no re-render during drag)
// Native DOM addEventListener with capture phase
// ═══════════════════════════════════════════════════════════════

interface DragSliderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function DragSlider({ children, className = '', style = {} }: DragSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });

  // onDown — capture start position, disable text selection
  const onDown = (e: React.PointerEvent | React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;

    e.preventDefault(); // Prevent browser default (image drag, text selection)

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
    };

    document.body.style.userSelect = 'none';
  };

  // onMove — calculate delta, apply scrollLeft
  const onMove = (e: React.PointerEvent | React.MouseEvent) => {
    const el = containerRef.current;
    if (!el || !dragRef.current.active) return;

    e.preventDefault();

    // Delta: how far mouse has moved from start point
    const delta = e.clientX - dragRef.current.startX;

    // Max scroll left boundary (negative)
    const maxScroll = -(el.scrollWidth - el.offsetWidth);

    // Apply: startScroll - delta  (dragging left = negative delta = increase scroll, moves right)
    el.scrollLeft = Math.max(maxScroll, Math.min(0, dragRef.current.startScroll - delta));
  };

  // onUp — reset drag state, re-enable text selection
  const onUp = () => {
    dragRef.current.active = false;
    document.body.style.userSelect = '';
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto no-scrollbar ${className}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      style={{
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}