'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function AntiFraudDataVault({ 
  children,
  supplierId = 'UNKNOWN'
}: { 
  children: React.ReactNode,
  supplierId?: string 
}) {
  
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const triggerSecurityAlert = () => {
      setIsHidden(true);
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsHidden(false);
        setIsAlertVisible(false);
      }, 3000);
    };

    // 1. Detect PrintScreen Key
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
      
      // Mac (Cmd+Shift+3/4/5) or Windows (PrintScreen / Win+Shift+S)
      if (
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.metaKey && e.shiftKey && e.key === 's')
      ) {
        e.preventDefault();
        triggerSecurityAlert();
        // Optional: clear clipboard to prevent copying
        if (navigator.clipboard) {
          navigator.clipboard.writeText('Data Protected by NINOC Security');
        }
      }
    };
    
    // 2. Hide on Blur (Snipping tools often blur the active window)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
    };

    const handleWindowBlur = () => {
      setIsHidden(true);
    };

    const handleWindowFocus = () => {
      setIsHidden(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  return (
    <div 
      className="relative overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Watermark Overlay (Hidden from pure DOM scraping, visible on screenshot) */}
      <div 
        className="pointer-events-none absolute inset-0 z-10 flex flex-wrap items-center justify-center opacity-[0.03]"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <p key={i} className="transform -rotate-12 text-xs font-mono font-bold whitespace-nowrap p-4">
            CONFIDENTIAL - {supplierId}
          </p>
        ))}
      </div>

      {/* Actual Data with Blur Protection */}
      <div className={`relative z-0 transition-all duration-200 ${isHidden ? 'blur-md opacity-20 select-none' : ''}`}>
        {children}
      </div>

      {/* Security Alert Toast */}
      {isAlertVisible && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg border border-red-200">
          <div className="text-center p-4">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-600">Pelanggaran Keamanan</p>
            <p className="text-xs text-red-500/80 font-medium mt-1">Pada sistem ini tidak bisa melakukan Screenshot/Copy. Data dilindungi!</p>
          </div>
        </div>
      )}
    </div>
  );
}
