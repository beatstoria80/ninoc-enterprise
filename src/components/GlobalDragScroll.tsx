"use client";

import { useEffect, useRef } from 'react';

export default function GlobalDragScroll() {
  const state = useRef({
    isMouseDown: false,
    isDragging: false,
    startY: 0,
    startX: 0,
    scrollTop: 0,
    scrollLeft: 0,
  });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // 1. Check for default prevented by other components (e.g. DragSlider)
      if (e.defaultPrevented) return;
      
      // 2. Only allow left click
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      
      // 3. Ignore interactive elements or explicitly marked non-draggable areas
      if (target.closest('button, a, input, textarea, select, [role="button"], [role="link"], [role="tab"], .no-drag')) {
        return;
      }

      state.current = {
        isMouseDown: true,
        isDragging: false, // We don't know if it's a drag until they move past the threshold
        startY: e.clientY,
        startX: e.clientX,
        scrollTop: window.scrollY || document.documentElement.scrollTop,
        scrollLeft: window.scrollX || document.documentElement.scrollLeft,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!state.current.isMouseDown) return;

      const y = e.clientY - state.current.startY;
      const x = e.clientX - state.current.startX;

      // 4. Implement a Drag Threshold (Deadzone) to allow normal text selection
      if (!state.current.isDragging) {
        const distance = Math.sqrt(x * x + y * y);
        if (distance > 5) {
          state.current.isDragging = true;
          // Apply grabbing styles only when drag is confirmed
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        } else {
          return; // Still within deadzone
        }
      }

      // 5. If we reach here, we are actively dragging
      e.preventDefault(); // Prevent text highlight only during actual drag

      window.scrollTo({
        top: state.current.scrollTop - y,
        left: state.current.scrollLeft - x,
        behavior: 'auto' // Instant scroll
      });
    };

    const cleanupDragState = () => {
      state.current.isMouseDown = false;
      if (state.current.isDragging) {
        state.current.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    const handleMouseUp = () => cleanupDragState();
    const handleMouseLeave = () => cleanupDragState();

    window.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cleanupDragState();
    };
  }, []);

  return null;
}
