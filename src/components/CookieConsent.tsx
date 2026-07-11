"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';

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

  const acceptAll = () => {
    try {
      localStorage.setItem('cookie-consent', 'accepted');
    } catch (e) {
      console.warn("Could not save cookie preference.");
    }
    setShow(false);
    // You could also initialize Google Analytics / Tag Manager here if strict privacy is required
  };

  const manageCookies = () => {
    try {
      localStorage.setItem('cookie-consent', 'managed');
    } catch (e) {
      console.warn("Could not save cookie preference.");
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-5 md:p-6 pointer-events-auto flex flex-col md:flex-row items-start md:items-center gap-6 relative">
            <div className="flex-1 text-neutral-300 text-sm leading-relaxed">
              <strong className="text-white block mb-2 text-base">We value your Privacy</strong>
              This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website and allow us to remember you. We use this information in order to improve and customize your browsing experience and for analytics and metrics about our visitors both on this website and other media. To find out more about the cookies we use, see our <Link href="/cookie-policy" className="text-white underline hover:text-neutral-300 transition-colors">Cookie Policy</Link>.
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              <button
                onClick={manageCookies}
                className="px-5 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 text-sm font-medium hover:bg-neutral-800 hover:text-white transition-colors whitespace-nowrap w-full sm:w-auto"
              >
                Manage Cookies
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2.5 rounded-lg bg-white text-neutral-900 text-sm font-bold hover:bg-neutral-200 transition-colors whitespace-nowrap w-full sm:w-auto"
              >
                Accept All Cookies
              </button>
            </div>
            
            <button 
              onClick={() => setShow(false)} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white md:hidden"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
