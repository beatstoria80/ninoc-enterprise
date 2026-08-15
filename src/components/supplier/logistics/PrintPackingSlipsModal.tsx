'use client';

import { X, Printer, Package } from 'lucide-react';
import { useEffect } from 'react';
import { ACTION_REQUIRED_STATUSES, OrderStatus } from '@/domain/supplier/OrderStatus';
import { ShippingLabel } from '@/components/admin/ShippingLabel';

interface PrintPackingSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  senderOverride?: {
    name: string;
    phone: string;
    city: string;
    province: string;
  };
}

export default function PrintPackingSlipsModal({ 
  isOpen, 
  onClose, 
  orders,
  senderOverride
}: PrintPackingSlipsModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter only orders that are ready to pack
  const toPackOrders = orders.filter(o => ACTION_REQUIRED_STATUSES.includes(o.status as OrderStatus));

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/95 backdrop-blur-md animate-in fade-in duration-300 print:hidden">
        
        {/* Top Navigation Bar - Hidden on Print */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-900">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white font-display">Print Preview</h2>
              <p className="text-sm text-gray-400">
                {toPackOrders.length} standard NINOC shipping labels generated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handlePrint}
              disabled={toPackOrders.length === 0}
              className="bg-white text-gray-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={18} />
              Print All Labels
            </button>
          </div>
        </div>

        {/* Preview Area (Scrollable Background) */}
        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar flex justify-center">
          
          {toPackOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package size={64} className="text-gray-600 mb-6" />
              <p className="text-xl font-medium text-white">No orders ready to pack</p>
              <p className="mt-2 text-center max-w-sm">All pending orders have been processed. There are currently no new shipping labels to generate.</p>
            </div>
          ) : (
            /* Scaled Visual Grid Preview */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center w-full max-w-6xl py-4">
              {toPackOrders.map((order) => (
                <div key={order.id} className="flex flex-col items-center gap-2">
                  <div style={{ position: 'relative', width: '68mm', height: '102mm', flexShrink: 0 }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100mm',
                      height: '150mm',
                      transform: 'scale(0.68)',
                      transformOrigin: 'top left',
                      overflow: 'hidden',
                    }} className="bg-white shadow-2xl rounded-sm border border-gray-200">
                      <ShippingLabel order={order} senderOverride={senderOverride} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono mt-1">ORDER ID: #{order.id.slice(0, 8).toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== PRINTABLE LABELS AREA ===== */}
      <div id="printable-labels-area" className="hidden print:block">
        {toPackOrders.map((order) => (
          <div key={order.id} className="print-label-page bg-white text-black p-0 m-0 overflow-hidden">
            <ShippingLabel order={order} senderOverride={senderOverride} />
          </div>
        ))}
      </div>

      {/* Clean Printing Media Style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: 100mm 150mm; margin: 0; }
          body * { visibility: hidden !important; }
          #printable-labels-area, #printable-labels-area * { visibility: visible !important; }
          #printable-labels-area {
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important;
            width: 100mm !important; 
            z-index: 9999 !important; 
            opacity: 1 !important;
            pointer-events: auto !important; 
            background: white !important;
          }
          .print-label-page {
            width: 100mm !important;
            height: 150mm !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      ` }} />
    </>
  );
}
