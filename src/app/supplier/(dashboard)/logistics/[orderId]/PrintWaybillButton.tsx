'use client';

import { FileText } from 'lucide-react';

export default function PrintWaybillButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <button 
      onClick={() => window.print()}
      disabled={disabled}
      className="h-full px-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FileText size={12} />
      PRINT WAYBILL
    </button>
  );
}
