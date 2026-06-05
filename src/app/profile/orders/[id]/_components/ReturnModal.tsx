"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Package, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReturnModalProps {
  orderId: string;
  userId: string;
  items: { id: string; product_name?: string; size?: string; quantity: number; price_at_purchase: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

const EASING = { out: [0.23, 1, 0.32, 1] } as const;

export function ReturnModal({ orderId, userId, items, onClose, onSuccess }: ReturnModalProps) {
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [reason, setReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() =>
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[itemId] > 0) {
        next[itemId] = 0;
      } else {
        next[itemId] = items.find(i => i.id === itemId)?.quantity || 1;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Alasan retur wajib diisi');
      return;
    }

    const checkedItems = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([order_item_id, quantity]) => ({
        order_item_id,
        quantity,
        reason,
      }));

    if (checkedItems.length === 0) {
      setError('Pilih minimal 1 item untuk diretur');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          user_id: userId,
          type: returnType,
          reason,
          items: checkedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal提交 retur');

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = Object.entries(selectedItems).filter(([, qty]) => qty > 0).length;
  const selectedTotal = Object.entries(selectedItems)
    .filter(([, qty]) => qty > 0)
    .reduce((sum, [itemId]) => {
      const item = items.find(i => i.id === itemId);
      return sum + (item ? item.price_at_purchase * (selectedItems[itemId] || 0) : 0);
    }, 0);

  const canProceed = selectedCount > 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: EASING.out }}
        className="relative bg-white w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between shrink-0 bg-ink/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-rose/10 rounded-sm flex items-center justify-center">
              <RefreshCw size={12} className="text-rose" />
            </div>
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink">Ajukan Retur</h2>
              <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-0.5">Return & Refund Request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-ink/30 hover:text-rose hover:bg-rose/5 transition-colors rounded-sm"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[8px] font-semibold uppercase tracking-wider transition-colors",
              step === 1 ? "bg-rose text-white" : "bg-emerald-500 text-white"
            )}>
              {step === 1 ? (
                <span>1</span>
              ) : (
                <Check size={9} strokeWidth={3} />
              )}
              <span>Pilih Item</span>
            </div>
            <div className="h-px flex-1 bg-ink/5" />
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[8px] font-semibold uppercase tracking-wider transition-colors",
              step === 2 ? "bg-rose text-white" : "bg-ink/5 text-ink/30"
            )}>
              <span>2</span>
              <span>Detail</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto minimal-scroll px-5 pb-5 space-y-4"
            >
              {/* Return Type */}
              <div>
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-2">Tipe Retur</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'refund' as const,
                      label: 'Refund',
                      desc: 'Dana kembali ke metode pembayaran asli',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      ),
                    },
                    {
                      id: 'exchange' as const,
                      label: 'Exchange',
                      desc: 'Tukar dengan produk lain yang sama',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                        </svg>
                      ),
                    },
                  ].map(opt => (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setReturnType(opt.id)}
                      className={cn(
                        'p-3 border text-left transition-all duration-200 rounded-sm',
                        returnType === opt.id
                          ? 'border-rose bg-rose/5 shadow-sm'
                          : 'border-ink/5 hover:border-ink/15 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={cn(
                          "transition-colors",
                          returnType === opt.id ? "text-rose" : "text-ink/30"
                        )}>
                          {opt.icon}
                        </span>
                        <p className={cn(
                          'text-[10px] font-bold uppercase tracking-wider transition-colors',
                          returnType === opt.id ? 'text-rose' : 'text-ink/50'
                        )}>
                          {opt.label}
                        </p>
                      </div>
                      <p className="text-[8px] text-ink/40 leading-relaxed">{opt.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Select Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Pilih Item</p>
                  <span className={cn(
                    "px-2 py-0.5 text-[7px] font-bold rounded-sm transition-colors",
                    selectedCount > 0 ? "bg-rose/10 text-rose" : "bg-ink/5 text-ink/30"
                  )}>
                    {selectedCount} dipilih
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item, idx) => {
                    const isSelected = selectedItems[item.id] > 0;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 border cursor-pointer transition-all duration-200 rounded-sm',
                          isSelected
                            ? 'border-rose/40 bg-rose/[0.03] shadow-sm'
                            : 'border-ink/5 hover:border-ink/15 hover:bg-ink/[0.01]'
                        )}
                      >
                        {/* Checkbox */}
                        <div className={cn(
                          "w-4.5 h-4.5 border flex items-center justify-center shrink-0 transition-all duration-200 rounded-sm",
                          isSelected ? 'bg-rose border-rose' : 'border-ink/20 bg-white'
                        )}>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </motion.div>
                          )}
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-ink uppercase tracking-wider">{item.product_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 bg-ink/5 text-[7px] text-ink/40 font-medium rounded-sm">SZ {item.size || 'N/A'}</span>
                            <span className="text-[7px] text-ink/30 font-medium">×{item.quantity}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="text-[9px] font-mono font-medium text-ink">
                            IDR {item.price_at_purchase.toLocaleString('id-ID')}
                          </p>
                          {isSelected && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[7px] text-rose font-medium mt-0.5"
                            >
                              Selected
                            </motion.p>
                          )}
                        </div>

                        <ChevronRight size={10} className={cn(
                          "text-ink/20 shrink-0 transition-colors",
                          isSelected && "text-rose"
                        )} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              {selectedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Subtotal</p>
                      <p className="text-[7px] text-ink/20 mt-0.5">{selectedCount} item</p>
                    </div>
                    <p className="text-[13px] font-display italic font-bold text-rose">
                      IDR {selectedTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto minimal-scroll px-5 pb-5 space-y-4"
            >
              {/* Summary of selected */}
              <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-3 space-y-1.5">
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Ringkasan Item</p>
                {Object.entries(selectedItems)
                  .filter(([, qty]) => qty > 0)
                  .map(([itemId, qty]) => {
                    const item = items.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package size={10} className="text-ink/30" />
                          <span className="text-[9px] font-medium text-ink uppercase">{item.product_name}</span>
                          <span className="text-[7px] text-ink/30">SZ {item.size}</span>
                          <span className="text-[7px] text-ink/30">×{qty}</span>
                        </div>
                        <span className="text-[9px] font-mono text-ink/60">IDR {(item.price_at_purchase * qty).toLocaleString('id-ID')}</span>
                      </div>
                    );
                  })}
                <div className="border-t border-ink/5 pt-1.5 mt-2 flex justify-between items-center">
                  <span className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Total Refund</span>
                  <span className="text-[12px] font-display italic font-bold text-rose">IDR {selectedTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Return Type Badge */}
              <div className="flex items-center gap-2 p-3 border border-ink/5 rounded-sm">
                <span className={cn(
                  "px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest rounded-sm",
                  returnType === 'refund' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                )}>
                  {returnType.toUpperCase()}
                </span>
                <p className="text-[9px] text-ink/60">
                  {returnType === 'refund' ? 'Dana dikembalikan ke rekening 3-5 hari kerja' : 'Produk ditukar dengan yang baru'}
                </p>
              </div>

              {/* Reason */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Alasan Retur <span className="text-rose">*</span></p>
                  <span className={cn(
                    "text-[7px] font-medium",
                    reason.length > 0 ? "text-emerald-500" : "text-ink/20"
                  )}>
                    {reason.length > 0 ? 'Filled' : 'Required'}
                  </span>
                </div>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                  placeholder="Jelaskan alasan retur secara detail. Contoh: Barang tidak sesuai ukuran — LB 52cm padahal seharusnya LB 54cm, Jahitan robekan di bagian ketiak kiri..."
                  className="w-full px-3 py-2.5 border border-ink/10 text-[11px] focus:outline-none focus:border-rose/40 resize-none placeholder:text-ink/15 rounded-sm leading-relaxed bg-ink/[0.01]"
                />
                {reason.length === 0 && (
                  <p className="text-[7px] text-ink/30 mt-1.5 italic">Minimal 10 karakter diperlukan</p>
                )}
              </div>

              {/* Policy reminder */}
              <div className="bg-rose/[0.03] border border-rose/10 rounded-sm p-3 space-y-1.5">
                <p className="text-[7px] font-semibold uppercase tracking-widest text-rose/60">Informasi Penting</p>
                <ul className="space-y-1">
                  <li className="text-[8px] text-ink/40 leading-relaxed flex items-start gap-2">
                    <span className="text-rose/40 font-bold mt-0.5">•</span>
                    Retur harus diajukan dalam 7 hari setelah barang diterima
                  </li>
                  <li className="text-[8px] text-ink/40 leading-relaxed flex items-start gap-2">
                    <span className="text-rose/40 font-bold mt-0.5">•</span>
                    Barang harus dalam kondisi belum digunakan / dicuci
                  </li>
                  <li className="text-[8px] text-ink/40 leading-relaxed flex items-start gap-2">
                    <span className="text-rose/40 font-bold mt-0.5">•</span>
                    Refund diproses 3-5 hari kerja setelah barang diterima
                  </li>
                </ul>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-sm"
                  >
                    <AlertCircle size={11} className="text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-ink/5 flex items-center justify-between gap-3 shrink-0 bg-ink/[0.01]">
          <div className="flex-1 flex justify-start">
            {step === 2 && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setStep(1)}
                className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-ink/50 hover:text-ink transition-colors flex items-center gap-1.5"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors rounded-sm"
            >
              Batal
            </button>
            {step === 1 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className={cn(
                  'px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white rounded-sm transition-colors flex items-center gap-2',
                  canProceed ? 'bg-rose hover:bg-rose/90' : 'bg-ink/20 text-ink/30 cursor-not-allowed'
                )}
              >
                Lanjut
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={isSubmitting || reason.trim().length < 10}
                className={cn(
                  'px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white rounded-sm transition-colors flex items-center gap-2',
                  !isSubmitting && reason.trim().length >= 10
                    ? 'bg-rose hover:bg-rose/90' : 'bg-ink/20 text-ink/30 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <RefreshCw size={10} />
                    Ajukan Sekarang
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}