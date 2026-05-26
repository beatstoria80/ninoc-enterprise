"use client";

import { useEffect } from 'react';

export default function SecurityEnforcer() {
  useEffect(() => {
    // Block right click (context menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block keyboard shortcuts for DevTools and Source Code
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
      }

      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
      }

      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
      }

      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
      }

      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
      }
    };

    // Prevent dragging images to protect assets
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SECURITY === 'true') {
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('dragstart', handleDragStart);
    } else {
      // Always enforce even in dev if requested, but usually it's annoying for developers. 
      // Given the user's strong request, we'll enforce it unconditionally.
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('dragstart', handleDragStart);
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return null;
}
