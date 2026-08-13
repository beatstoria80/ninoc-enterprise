'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShoppingBag, ArrowRight } from 'lucide-react';

interface WarehouseConflictToastProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAndSwitch?: () => void;
  currentWarehouseName?: string;
  newWarehouseName?: string;
}

export function WarehouseConflictModal({
  isOpen,
  onClose,
  onClearAndSwitch,
  currentWarehouseName = 'Gudang saat ini',
  newWarehouseName = 'Gudang lain',
}: WarehouseConflictToastProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed left-1/2 top-1/2 z-[1000] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-ink/8">
              
              {/* Header accent */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/8 hover:text-ink"
              >
                <X size={16} />
              </button>

              <div className="p-6">
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <AlertTriangle size={22} strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className="mb-1 text-base font-semibold text-ink">
                  Produk dari Gudang Berbeda
                </h3>

                {/* Description */}
                <p className="mb-4 text-[13px] leading-relaxed text-ink/60">
                  Setiap pesanan diproses dari <strong>satu gudang</strong>. Produk ini berasal dari gudang yang berbeda dengan keranjang Anda.
                </p>

                {/* Warehouse comparison */}
                <div className="mb-5 rounded-xl border border-ink/8 bg-ink/[0.02] p-3.5 text-[12px]">
                  <div className="flex items-start gap-2.5">
                    <ShoppingBag size={13} className="mt-0.5 shrink-0 text-ink/40" />
                    <div className="flex-1 min-w-0">
                      <span className="text-ink/50">Keranjang kamu:</span>
                      <p className="font-medium text-ink truncate">{currentWarehouseName}</p>
                    </div>
                  </div>
                  <div className="my-2 border-t border-dashed border-ink/10" />
                  <div className="flex items-start gap-2.5">
                    <ArrowRight size={13} className="mt-0.5 shrink-0 text-rose-400" />
                    <div className="flex-1 min-w-0">
                      <span className="text-ink/50">Produk ini:</span>
                      <p className="font-medium text-rose-500 truncate">{newWarehouseName}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {onClearAndSwitch && (
                    <button
                      onClick={() => {
                        onClearAndSwitch();
                        onClose();
                      }}
                      className="w-full rounded-xl bg-ink py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-80 active:opacity-70"
                    >
                      Kosongkan Keranjang & Tambah Produk Ini
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full rounded-xl border border-ink/12 py-2.5 text-[13px] font-medium text-ink/70 transition-colors hover:bg-ink/[0.04]"
                  >
                    Batal, Lanjutkan Pesanan Sebelumnya
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
