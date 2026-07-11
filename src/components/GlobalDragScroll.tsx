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
          
          // CRITICAL FIX: Nonaktifkan semua interaksi pointer pada body children
          // Ini mencegah event pointerup/click mengenai elemen seperti <Link> atau tombol
          document.body.style.pointerEvents = 'none';
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
        
        // Jeda waktu yang sedikit lebih lama untuk memastikan semua event ghost 
        // (click, pointerup) selesai diproses (swallowed) oleh window sebelum 
        // interaksi pada body diaktifkan kembali.
        setTimeout(() => {
          document.body.style.pointerEvents = '';
          state.current.wasDragging = false;
        }, 100);
      }
    };

    const handleMouseUp = () => cleanupDragState();
    const handleMouseLeave = () => cleanupDragState();

    // Global Click Interceptor (Capture Phase)
    // Sebagai lapis keamanan tambahan jika ada event click yang masih tembus
    const handleClickCapture = (e: MouseEvent) => {
      if (state.current.wasDragging) {
        e.preventDefault();
        e.stopPropagation();
        state.current.wasDragging = false; // Consume the flag
      }
    };

    // Global PointerUp Interceptor (Capture Phase)
    // Framer Motion dan UI libraries sering menggunakan onPointerUp daripada onClick
    const handlePointerUpCapture = (e: PointerEvent) => {
      if (state.current.wasDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Interceptors for both click and pointerup
    window.addEventListener('click', handleClickCapture, true);
    window.addEventListener('pointerup', handlePointerUpCapture, true);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClickCapture, true);
      window.removeEventListener('pointerup', handlePointerUpCapture, true);
      cleanupDragState();
    };
  }, []);

  return null;
}
