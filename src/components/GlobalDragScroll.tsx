"use client";

import { useEffect, useRef } from 'react';

export default function GlobalDragScroll() {
  const state = useRef({
    isMouseDown: false,
    isDragging: false,
    wasDragging: false, // Tracks if a drag occurred to block the subsequent click
    startY: 0,
    startX: 0,
    scrollTop: 0,
    scrollLeft: 0,
  });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      
      // Ignore explicitly marked non-draggable areas (like DragSlider)
      // Removed restrictions on <a> and <button> so users can drag anywhere!
      if (target.closest('.no-drag')) {
        return;
      }

      state.current = {
        ...state.current,
        isMouseDown: true,
        isDragging: false,
        wasDragging: false,
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

      if (!state.current.isDragging) {
        const distance = Math.sqrt(x * x + y * y);
        if (distance > 5) {
          state.current.isDragging = true;
          state.current.wasDragging = true;
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        } else {
          return;
        }
      }

      e.preventDefault();

      window.scrollTo({
        top: state.current.scrollTop - y,
        left: state.current.scrollLeft - x,
        behavior: 'auto'
      });
    };

    const cleanupDragState = () => {
      state.current.isMouseDown = false;
      if (state.current.isDragging) {
        state.current.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Reset wasDragging shortly after to allow the click blocker to fire
        setTimeout(() => {
          state.current.wasDragging = false;
        }, 50);
      }
    };

    const handleMouseUp = () => cleanupDragState();
    const handleMouseLeave = () => cleanupDragState();

    // Global Click Interceptor (Capture Phase)
    // Runs before any standard click event on the page
    const handleClickCapture = (e: MouseEvent) => {
      if (state.current.wasDragging) {
        e.preventDefault();
        e.stopPropagation();
        state.current.wasDragging = false; // Consume the flag
      }
    };

    window.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Add click capture listener to the window
    window.addEventListener('click', handleClickCapture, true);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClickCapture, true);
      cleanupDragState();
    };
  }, []);

  return null;
}
