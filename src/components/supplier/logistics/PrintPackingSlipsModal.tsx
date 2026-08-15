'use client';

import { X, Printer, Package, User, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { ACTION_REQUIRED_STATUSES, OrderStatus } from '@/domain/supplier/OrderStatus';

interface PrintPackingSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
}

export default function PrintPackingSlipsModal({ isOpen, onClose, orders }: PrintPackingSlipsModalProps) {
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/95 backdrop-blur-md animate-in fade-in duration-300 print:bg-white print:!block">
      
      {/* Top Navigation Bar - Hidden on Print */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-900 print:hidden">
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
              {toPackOrders.length} packing slips generated
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
            Print All Slips
          </button>
        </div>
      </div>

      {/* Preview Area (Scrollable Background) */}
      <div className="flex-1 overflow-y-auto p-8 print:p-0 hide-scrollbar flex justify-center">
        
        {toPackOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 print:hidden">
            <Package size={64} className="text-gray-600 mb-6" />
            <p className="text-xl font-medium text-white">No orders ready to pack</p>
            <p className="mt-2 text-center max-w-sm">All pending orders have been processed. There are currently no new packing slips to generate.</p>
          </div>
        ) : (
          <div className="w-full max-w-[210mm] space-y-8 print:space-y-0 print:block">
            {toPackOrders.map((order, idx) => (
              <div 
                key={order.id} 
                className="bg-white w-full min-h-[297mm] p-12 shadow-2xl rounded-sm print:shadow-none print:rounded-none print:min-h-0 print:h-[297mm] print:break-after-page relative overflow-hidden"
              >
                {/* Decorative background logo/watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none">
                  <span className="font-display font-black text-[200px] tracking-tighter">NINOC</span>
                </div>

                {/* Slip Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8 relative z-10">
                  <div>
                    <h1 className="font-display font-black text-4xl tracking-tighter text-black uppercase">NINOC B2B</h1>
                    <p className="text-sm font-medium text-gray-500 mt-2 tracking-widest uppercase">Warehouse Operations</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="border-4 border-black px-4 py-2 mb-3">
                      <p className="font-black text-2xl uppercase tracking-wider">{order.courier || 'STANDARD'}</p>
                    </div>
                    {/* Fake Barcode */}
                    <div className="font-mono text-xs tracking-[0.3em] flex flex-col items-end opacity-70">
                      <div className="h-8 w-48 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px,black_4px,black_5px,transparent_5px,transparent_8px,black_8px,black_10px,transparent_10px,transparent_12px)]"></div>
                      <span className="mt-1">{order.id.slice(0, 12).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12 relative z-10">
                  {/* Sender Info */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Sender (Supplier)</h3>
                    <p className="font-bold text-gray-900 text-lg">NINOC Allocation Hub</p>
                    <p className="text-gray-600 mt-1 leading-relaxed text-sm">
                      Jl. Pegangsaan Dua No. 88<br />
                      Kelapa Gading, Jakarta Utara<br />
                      DKI Jakarta, 14250
                    </p>
                    <p className="text-gray-500 mt-3 text-sm">Date: {order.created_at ? format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm') : '-'}</p>
                  </div>

                  {/* Recipient Info */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Ship To</h3>
                    <p className="font-bold text-black text-xl">{order.customer_name || 'Customer Name'}</p>
                    <p className="text-black font-medium mt-2 leading-relaxed text-base">
                      {order.shipping_address?.address || 'Alamat tidak tersedia. Harap hubungi customer service untuk detail pengiriman.'}
                      <br />
                      {order.shipping_address?.city || 'Kota'}, {order.shipping_address?.province || 'Provinsi'} {order.shipping_address?.postal_code || ''}
                    </p>
                    {order.customer_phone && <p className="text-black font-medium mt-3 text-base">Tel: {order.customer_phone}</p>}
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="relative z-10">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b-2 border-black pb-2 flex justify-between">
                    <span>Order Contents</span>
                    <span>{order.itemsCount} Items</span>
                  </h3>
                  
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-black">
                        <th className="py-3 px-4 text-sm font-bold w-16 text-center border-b border-gray-300">QTY</th>
                        <th className="py-3 px-4 text-sm font-bold border-b border-gray-300">Item Description</th>
                        <th className="py-3 px-4 text-sm font-bold w-32 border-b border-gray-300">Variant</th>
                        <th className="py-3 px-4 text-sm font-bold w-12 text-center border-b border-gray-300">Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {order.order_items?.map((item: any, index: number) => (
                        <tr key={index} className="break-inside-avoid">
                          <td className="py-4 px-4 text-center">
                            <span className="font-black text-xl">{item.quantity}</span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-black text-base">{item.product_name}</p>
                            <p className="text-sm text-gray-500 mt-1 font-mono">SKU: {item.id ? item.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              {item.color && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-sm w-fit uppercase">
                                  {item.color}
                                </span>
                              )}
                              {item.size && (
                                <span className="inline-block px-2 py-1 border border-gray-300 text-gray-800 text-xs font-bold rounded-sm w-fit uppercase">
                                  SIZE {item.size}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center align-middle">
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-sm mx-auto"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes */}
                <div className="absolute bottom-12 left-12 right-12 pt-6 border-t-2 border-black flex justify-between items-end relative z-10 mt-20">
                  <div className="max-w-md">
                    <p className="text-xs font-bold text-black uppercase tracking-widest">Quality Assurance</p>
                    <p className="text-xs text-gray-500 mt-1">This package has been packed securely and passed NINOC Warehouse Quality Control. Do not accept if seal is broken.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-black text-gray-300 text-4xl tracking-tighter">NINOC.</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
