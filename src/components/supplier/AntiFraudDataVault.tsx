'use client';

import React, { useEffect } from 'react';

export default function AntiFraudDataVault({ 
  children,
  supplierId = 'UNKNOWN'
}: { 
  children: React.ReactNode,
  supplierId?: string 
}) {
  
  // Disable keyboard shortcuts for copy/paste/print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

      {/* Actual Data */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
