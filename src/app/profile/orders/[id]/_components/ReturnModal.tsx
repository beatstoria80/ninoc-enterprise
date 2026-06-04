"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReturnModalProps {
  orderId: string;
  userId: string;
  items: { id: string; product_name?: string; size?: string; quantity: number; price_at_purchase: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ReturnModal({ orderId, userId, items, onClose, onSuccess }: ReturnModalProps) {
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [reason, setReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() =>
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const selectedCount = Object.values(selectedItems).filter(v => v > 0).length;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="relative bg-white w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-rose" />
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink">Ajukan Retur</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-ink/30 hover:text-rose hover:bg-rose/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto minimal-scroll p-5 space-y-5">

          {/* Return Type */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/40 mb-2">Tipe Retur</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'refund' as const, label: 'Refund', desc: 'Uang kembali ke rekening' },
                { id: 'exchange' as const, label: 'Exchange', desc: 'Tukar dengan produk lain' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setReturnType(opt.id)}
                  className={cn(
                    'p-3 border text-left transition-colors',
                    returnType === opt.id
                      ? 'border-rose bg-rose/5'
                      : 'border-ink/10 hover:border-ink/20'
                  )}
                >
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wider', returnType === opt.id ? 'text-rose' : 'text-ink/70')}>
                    {opt.label}
                  </p>
                  <p className="text-[8px] text-ink/30 mt-0.5 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Select Items */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/40 mb-2">
              Pilih Item ({selectedCount} dipilih)
            </p>
            <div className="space-y-1.5">
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 border cursor-pointer transition-colors',
                    selectedItems[item.id] > 0
                      ? 'border-rose bg-rose/5'
                      : 'border-ink/10 hover:border-ink/20'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 border flex items-center justify-center shrink-0 transition-colors',
                    selectedItems[item.id] > 0 ? 'bg-rose border-rose' : 'border-ink/30 bg-white'
                  )}>
                    {selectedItems[item.id] > 0 && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-ink uppercase">{item.product_name}</p>
                    <p className="text-[9px] text-ink/40">Size {item.size || 'N/A'} · Qty {item.quantity} · IDR {item.price_at_purchase.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/40 mb-2">Alasan Retur <span className="text-rose">*</span></p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Contoh: Barang tidak sesuai ukuran, cacat jahitan..."
              className="w-full px-3 py-2.5 border border-ink/10 text-[11px] focus:outline-none focus:border-rose/40 resize-none placeholder:text-ink/20"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100">
              <AlertCircle size={12} className="text-red-500 shrink-0" />
              <p className="text-[10px] text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-ink/5 flex items-center justify-end gap-2 shrink-0 bg-ink/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-ink/50 hover:text-ink transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors',
              isSubmitting
                ? 'bg-ink/30 cursor-not-allowed'
                : 'bg-rose hover:bg-rose/90'
            )}
          >
            {isSubmitting ? 'Mengirim...' : 'Ajukan Retur'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
