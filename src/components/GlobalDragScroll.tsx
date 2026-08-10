"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUIPreferences } from '@/store/useUIPreferences';

export default function GlobalDragScroll() {
  const pathname = usePathname();
  const dragScrollEnabled = useUIPreferences((state) => state.dragScrollEnabled);
  
  const state = useRef({
    isMouseDown: false,
    isDragging: false,
    wasDragging: false,
    startY: 0,
    startX: 0,
    scrollTop: 0,
    scrollLeft: 0,
  });

  // Nonaktifkan drag scroll untuk rute admin atau dashboard, kecuali jika diaktifkan di preferences
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/supplier') || pathname?.startsWith('/dashboard');
  const shouldDisableDragScroll = isDashboardRoute && !dragScrollEnabled;

  useEffect(() => {
    // Kelola class global pada html untuk mengembalikan UI/UX normal (scrollbar & native scroll)
    if (shouldDisableDragScroll) {
      document.documentElement.classList.add('admin-route');
      return;
    } else {
      document.documentElement.classList.remove('admin-route');
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (target.closest('.no-drag, nav, header, a, button, input, select, textarea, [role="button"], .leaflet-container, .leaflet-interactive, .leaflet-control, .leaflet-pane')) return;

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
        
        setTimeout(() => {
          document.body.style.pointerEvents = '';
          state.current.wasDragging = false;
        }, 100);
      }
    };

    const handleMouseUp = () => cleanupDragState();
    const handleMouseLeave = () => cleanupDragState();

    const handleClickCapture = (e: MouseEvent) => {
      if (state.current.wasDragging) {
        e.preventDefault();
        e.stopPropagation();
        state.current.wasDragging = false;
      }
    };

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
  }, [shouldDisableDragScroll]);

  if (shouldDisableDragScroll) return null;

  return null;
}
