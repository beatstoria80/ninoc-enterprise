'use client';

import { FileText } from 'lucide-react';

export default function PrintWaybillButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="h-full px-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 rounded-sm"
    >
      <FileText size={12} />
      PRINT WAYBILL
    </button>
  );
}
