'use client';

import { useState } from 'react';
import { X, Truck, Info, MapPin } from 'lucide-react';

interface PickupRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  courierName: string;
  warehouseName?: string;
  requestAction: (orderId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onSuccess: () => void;
}

export default function PickupRequestModal({
  isOpen,
  onClose,
  orderId,
  courierName,
  warehouseName,
  requestAction,
  onSuccess
}: PickupRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPickup = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await requestAction(orderId);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.error || 'Failed to request pickup');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-medium text-lg text-ink">Request Courier Pickup</h3>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-ink/40 hover:text-ink/80 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-800">
            <Info className="shrink-0 mt-0.5" size={18} />
            <div className="text-sm leading-relaxed">
              Ensure all items are securely packed before requesting a pickup. Once requested, the courier will be dispatched to your registered facility address.
            </div>
          </div>
          
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-ink/60">Order ID</span>
              <span className="text-sm font-medium text-ink">{orderId}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-ink/60">Courier</span>
              <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <Truck size={14} className="text-ink/60" />
                {courierName}
              </div>
            </div>
            <div className="flex justify-between items-start py-2">
              <span className="text-sm text-ink/60 mt-1">Pickup From</span>
              <div className="flex items-start gap-1.5 text-sm font-medium text-ink text-right max-w-[200px]">
                <MapPin size={14} className="text-ink/60 shrink-0 mt-1" />
                <span>{warehouseName || 'Your Main Warehouse (Configured Location)'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleRequestPickup}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-ink rounded-md hover:bg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Confirm Pickup'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
