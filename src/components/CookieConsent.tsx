"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent) {
        // Small delay for better UX
        const timer = setTimeout(() => setShow(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignore localStorage errors (e.g., if cookies are blocked by browser)
      console.warn("localStorage is not available.");
    }
  }, []);

  const handleConsent = (status: 'accepted' | 'declined' | 'managed') => {
    try {
      localStorage.setItem('cookie-consent', status);
    } catch (e) {
      console.warn("Could not save cookie preference.");
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 z-[99990] pointer-events-none md:bottom-6 md:left-6 w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-5 md:p-6 pointer-events-auto flex flex-col relative overflow-hidden">
            <div className="absolute -top-8 -right-8 text-neutral-800/40 transform rotate-12">
              <Cookie size={120} />
            </div>
            
            <button 
              onClick={() => handleConsent('declined')} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-10"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Cookie size={20} className="text-white" />
                <strong className="text-white text-base">Pilihan Privasi Anda</strong>
              </div>
              
              <p className="text-neutral-400 text-sm leading-relaxed mb-5 pr-2">
                Kami menggunakan cookie untuk meningkatkan pengalaman Anda, menyajikan konten yang relevan, dan menganalisis trafik. 
                Baca <Link href="/cookie-policy" className="text-white underline hover:text-neutral-300 transition-colors">Kebijakan Cookie</Link> kami.
              </p>
              
              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  onClick={() => handleConsent('accepted')}
                  className="w-full py-2.5 rounded-lg bg-white text-neutral-900 text-sm font-bold hover:bg-neutral-200 transition-colors"
                >
                  Terima Semua
                </button>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleConsent('declined')}
                    className="w-full py-2.5 rounded-lg border border-neutral-700 text-neutral-300 text-sm font-medium hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleConsent('managed')}
                    className="w-full py-2.5 rounded-lg border border-neutral-700 text-neutral-300 text-sm font-medium hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    Atur
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
