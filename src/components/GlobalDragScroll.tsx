"use client";

import { useEffect, useRef } from 'react';

export default function GlobalDragScroll() {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const scrollTop = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Hanya berjalan pada klik kiri (button 0)
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      
      // Abaikan elemen interaktif yang seharusnya diklik atau elemen dengan class .no-drag
      if (target.closest('button, a, input, textarea, select, [role="button"], [role="link"], [role="tab"], .no-drag')) {
        return;
      }

      isDragging.current = true;
      startY.current = e.clientY;
      startX.current = e.clientX;
      scrollTop.current = window.scrollY || document.documentElement.scrollTop;
      scrollLeft.current = window.scrollX || document.documentElement.scrollLeft;

      // Ubah kursor menjadi grabbing
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      e.preventDefault(); // Mencegah highlight text saat drag

      const y = e.clientY - startY.current;
      const x = e.clientX - startX.current;
      
      // Scroll window sesuai arah geseran
      window.scrollTo({
        top: scrollTop.current - y,
        left: scrollLeft.current - x,
        behavior: 'auto' // Instant scroll
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleMouseLeave = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    // Tambahkan event listener pada window
    window.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave); // Menangani ketika kursor keluar jendela browser

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      // Reset style saat komponen unmount
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return null;
}
