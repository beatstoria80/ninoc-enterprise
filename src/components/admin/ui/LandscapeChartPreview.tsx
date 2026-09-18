"use client";

import React, { useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandscapeChartPreviewProps {
  /** The chart title shown in the fullscreen header */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** The chart content to render in landscape fullscreen */
  children: ReactNode;
}

/**
 * LandscapeChartPreview
 * 
 * A button + fullscreen overlay that allows mobile users to view 
 * chart/graphic content in a simulated landscape orientation.
 * 
 * Uses CSS transform: rotate(90deg) to rotate the chart container
 * without requiring physical device rotation. This is much more 
 * efficient than forcing the entire dashboard to landscape mode.
 * 
 * The button is only visible on mobile (md:hidden).
 */
export function LandscapeChartPreview({ title, subtitle, children }: LandscapeChartPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  React.useEffect(() => {
    return () => {
      if (isOpen) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, []);

  return (
    <>
      {/* Trigger Button — only visible on mobile */}
      <button
        onClick={handleOpen}
        className="md:hidden p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        title="Lihat grafik dalam mode landscape"
        aria-label="Landscape preview"
      >
        <Maximize2 size={12} />
      </button>

      {/* Fullscreen Landscape Overlay */}
      {mounted && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[10000] bg-white flex items-center justify-center"
              style={{ touchAction: 'none' }}
            >
              {/* Rotated Container — simulates landscape */}
              <div
                className="absolute flex flex-col"
                style={{
                  // Swap width/height via transform to simulate landscape
                  width: '100vh',
                  height: '100vw',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  transformOrigin: 'center center',
                }}
              >
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
                  <div className="flex flex-col">
                    <h3 className="text-xs font-medium text-ink uppercase tracking-wider">{title}</h3>
                    {subtitle && (
                      <p className="text-[10px] text-ink/50 uppercase tracking-widest mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Landscape Preview</span>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Close landscape preview"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Chart Content — fills remaining space */}
                <div className="flex-1 w-full p-4 min-h-0 bg-white">
                  {children}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
