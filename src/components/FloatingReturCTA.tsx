"use client";

import React, { useState } from 'react';
import Link from '@/components/LocalizedLink';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

interface FloatingReturCTAProps {
  /** Pages where the banner is hidden */
  excludePaths?: string[];
  className?: string;
}

export function FloatingReturCTA({ excludePaths = [], className = '' }: FloatingReturCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  // Hide on retur pages
  if (typeof window !== 'undefined') {
    if (excludePaths.some(p => window.location.pathname.startsWith(p))) return null;
  }

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`fixed bottom-24 right-4 z-[120] ${className}`}
      >
        <div className="bg-white border border-ink/10 rounded-sm shadow-xl shadow-ink/5 p-0 w-56">
          {/* Header */}
          <div className="flex items-start gap-2 p-2.5">
            <div className="w-7 h-7 bg-rose/10 rounded-full flex items-center justify-center shrink-0">
              <RefreshCw size={13} className="text-rose" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-ink uppercase tracking-wider leading-tight">
                Retur & Refund
              </p>
              <p className="text-[8px] text-ink/60 mt-px leading-snug">
                Klaim 2x24 jam · Guest bisa ajukan
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-ink/40 hover:text-ink/60 transition-colors -mt-px"
            >
              <X size={12} />
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/retur"
            className="flex items-center justify-center gap-1.5 mx-2.5 mb-2.5 py-2 bg-rose text-white text-[9px] font-semibold uppercase tracking-widest rounded-sm hover:bg-rose/90 transition-colors"
          >
            <RefreshCw size={9} strokeWidth={1.5} />
            Ajukan Sekarang
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
