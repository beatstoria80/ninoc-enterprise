import { Banknote } from 'lucide-react';

export default function SupplierLedgerPage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
        <Banknote size={40} className="text-emerald-500 opacity-80" />
      </div>
      <h1 className="text-2xl font-bold font-display text-gray-900 mb-2">Sales & Payouts Ledger</h1>
      <p className="text-gray-500 text-center max-w-md">
        This module is currently being finalized. Soon, you will be able to view your detailed sales reports and payout history.
      </p>
      <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
        <span className="text-xs font-medium text-gray-600">Under Construction by Ninoc Engineering</span>
      </div>
    </div>
  );
}
