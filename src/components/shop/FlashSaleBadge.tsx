import React from 'react';

export const FlashSaleBadge = React.memo(function FlashSaleBadge({ percentOff, text = "FLASH SALE" }: { percentOff?: number, text?: string }) {
  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
      <div className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm flex items-center gap-1 uppercase tracking-widest">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
        </svg>
        {text}
      </div>
      {percentOff && percentOff > 0 && (
        <div className="bg-white/90 backdrop-blur-sm text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm self-start border border-rose-100">
          -{Math.round(percentOff)}%
        </div>
      )}
    </div>
  );
});
