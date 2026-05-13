"use client";

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Disable Lenis on mobile — use native momentum scroll instead
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
      // Disable Lenis on drag-active elements to prevent event conflict
      // Lenis intercepts pointer events and blocks custom drag on slider
      // Allow native scroll everywhere — custom drag handles slider
    });

    // Stop Lenis during any pointer interaction over the slider
    const stopLenisOnDrag = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const slider = target.closest('[data-slider]');
      if (slider && lenisRef.current) {
        lenisRef.current.stop();
      }
    };

    const resumeLenisOnRelease = () => {
      if (lenisRef.current) {
        lenisRef.current.start();
      }
    };

    document.addEventListener('pointerdown', stopLenisOnDrag);
    document.addEventListener('pointerup', resumeLenisOnRelease);
    document.addEventListener('pointerleave', resumeLenisOnRelease);

    function raf(time: number) {
      lenisRef.current?.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      document.removeEventListener('pointerdown', stopLenisOnDrag);
      document.removeEventListener('pointerup', resumeLenisOnRelease);
      document.removeEventListener('pointerleave', resumeLenisOnRelease);
    };
  }, []);

  return <>{children}</>;
}