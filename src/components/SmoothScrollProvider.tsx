"use client";

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Global pointer handler — stops Lenis when dragging anywhere on page
    const onGlobalPointerDown = (e: PointerEvent) => {
      console.log('[LENIS DEBUG] Global pointerdown on:', (e.target as HTMLElement).tagName, 'class:', (e.target as HTMLElement).className);
      const target = e.target as HTMLElement;
      // Stop Lenis for ALL pointer interactions on page (not just slider)
      // This ensures no pointer event is intercepted by Lenis during drag
      if (lenisRef.current && !isDragging.current) {
        lenisRef.current.stop();
        console.log('[LENIS DEBUG] Lenis STOPPED');
      }
      isDragging.current = true;
    };

    const onGlobalPointerUp = () => {
      if (lenisRef.current) {
        lenisRef.current.start();
        console.log('[LENIS DEBUG] Lenis STARTED');
      }
      isDragging.current = false;
    };

    document.addEventListener('pointerdown', onGlobalPointerDown);
    document.addEventListener('pointerup', onGlobalPointerUp);
    document.addEventListener('pointerleave', onGlobalPointerUp);

    function raf(time: number) {
      lenisRef.current?.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      document.removeEventListener('pointerdown', onGlobalPointerDown);
      document.removeEventListener('pointerup', onGlobalPointerUp);
      document.removeEventListener('pointerleave', onGlobalPointerUp);
    };
  }, []);

  return <>{children}</>;
}