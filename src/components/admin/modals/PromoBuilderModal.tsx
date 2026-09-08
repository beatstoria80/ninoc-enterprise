'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Tag, PackagePlus, Package, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/components/admin/types';
import { createClient } from '@/utils/supabase/client';

type PromoMode = 'discount' | 'volume';

interface PromoBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: PromoMode;
  products: Product[];
  editingProduct?: Product | null;
  onComplete: () => void;
}

interface DiscountConfig {
  original_price: string;
  discount_start_date: string;
  discount_end_date: string;
}

interface VolumeConfig {
  bundle_min_qty: string;
  bundle_discount_amount: string;
}

export default function PromoBuilderModal({ isOpen, onClose, mode, products, editingProduct, onComplete }: PromoBuilderModalProps) {
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [quickDiscount, setQuickDiscount] = useState<number | null>(null);

  const [discountConfig, setDiscountConfig] = useState<DiscountConfig>({
    original_price: '',
    discount_start_date: '',
    discount_end_date: '',
  });

  const [volumeConfig, setVolumeConfig] = useState<VolumeConfig>({
    bundle_min_qty: '2',
    bundle_discount_amount: '25000',
  });

  React.useEffect(() => {
    if (isOpen && editingProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(2);
      setSelectedIds(new Set([editingProduct.id]));
      if (mode === 'discount') {
        const start = editingProduct.discount_start_date ? new Date(editingProduct.discount_start_date) : null;
        const end = editingProduct.discount_end_date ? new Date(editingProduct.discount_end_date) : null;

        // Convert dates to local datetime string for input type="datetime-local"
        const toLocalStr = (d: Date) => {
          const pad = (n: number) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setDiscountConfig({
          original_price: editingProduct.original_price?.toString() || '',
          discount_start_date: start ? toLocalStr(start) : '',
          discount_end_date: end ? toLocalStr(end) : '',
        });
      } else {
        setVolumeConfig({
          bundle_min_qty: editingProduct.bundle_min_qty?.toString() || '2',
          bundle_discount_amount: editingProduct.bundle_discount_amount?.toString() || '25000',
        });
      }
    } else if (isOpen && !editingProduct) {
      setStep(1);
      setSelectedIds(new Set());
    }
  }, [isOpen, editingProduct, mode]);

  const eligibleProducts = useMemo(() => {
    return products.filter(p => {
      // Allow editing product to be eligible even if it has properties
      if (editingProduct && p.id === editingProduct.id) return true;
      if (mode === 'discount') return !p.bundle_min_qty;
      return !p.original_price;
    });
  }, [products, mode, editingProduct]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return eligibleProducts;
    const q = search.toLowerCase();
    return eligibleProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
  }, [eligibleProducts, search]);

  const selectedProducts = useMemo(() => {
    return products.filter(p => selectedIds.has(p.id));
  }, [products, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);

    try {
      const ids = Array.from(selectedIds);

      if (mode === 'discount') {
        for (const id of ids) {
          const product = products.find(p => p.id === id);
          if (!product) continue;

          let originalPrice: number;
          let finalPrice: number;

          if (quickDiscount) {
            originalPrice = product.price;
            finalPrice = Math.round(product.price * (1 - quickDiscount / 100));
          } else if (discountConfig.original_price) {
            originalPrice = parseInt(discountConfig.original_price);
            finalPrice = product.price;
          } else {
            continue;
          }

          const updateData: Record<string, unknown> = {
            original_price: originalPrice,
            price: finalPrice,
          };

          if (discountConfig.discount_start_date) {
            updateData.discount_start_date = new Date(discountConfig.discount_start_date).toISOString();
          }
          if (discountConfig.discount_end_date) {
            updateData.discount_end_date = new Date(discountConfig.discount_end_date).toISOString();
          }

          await supabase.from('products').update(updateData).eq('id', id);
        }
      } else {
        const minQty = parseInt(volumeConfig.bundle_min_qty) || 2;
        const discountAmt = parseInt(volumeConfig.bundle_discount_amount) || 0;

        for (const id of ids) {
          await supabase.from('products').update({
            bundle_min_qty: minQty,
            bundle_discount_amount: discountAmt,
          }).eq('id', id);
        }
      }

      onComplete();
      handleClose();
    } catch (err) {
      console.error('Promo save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSearch('');
    setSelectedIds(new Set());
    setQuickDiscount(null);
    setDiscountConfig({ original_price: '', discount_start_date: '', discount_end_date: '' });
    setVolumeConfig({ bundle_min_qty: '2', bundle_discount_amount: '25000' });
    onClose();
  };

  if (!isOpen) return null;

  const isDiscount = mode === 'discount';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* HEADER */}
          <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r ${isDiscount ? 'from-rose-50 to-white' : 'from-purple-50 to-white'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDiscount ? 'bg-rose-100 text-rose-600' : 'bg-purple-100 text-purple-600'}`}>
                {isDiscount ? <Tag size={18} /> : <PackagePlus size={18} />}
              </div>
              <div>
                <h2 className="text-sm font-display font-semibold italic uppercase tracking-tight text-ink">
                  {editingProduct ? (isDiscount ? 'Edit Program Diskon' : 'Edit Program Volume / Grosir') : (isDiscount ? 'Buat Program Diskon' : 'Buat Program Volume / Grosir')}
                </h2>
                <p className="text-[10px] text-ink/50 uppercase tracking-widest">
                  {editingProduct ? 'Step Konfigurasi' : `Step ${step}/2 — ${step === 1 ? 'Pilih Produk' : 'Konfigurasi'}`}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} className="text-ink/40" />
            </button>
          </div>

          {/* STEP 1: PRODUCT PICKER */}
          {step === 1 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                    autoFocus
                  />
                </div>
                <button
                  onClick={selectAll}
                  className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? 'Hapus Semua' : 'Pilih Semua'}
                </button>
                <div className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest ${isDiscount ? 'bg-rose-50 text-rose-600' : 'bg-purple-50 text-purple-600'}`}>
                  {selectedIds.size} Dipilih
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-ink/40">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs uppercase tracking-widest font-medium">
                      {eligibleProducts.length === 0
                        ? (isDiscount ? 'Semua produk sudah ikut promo volume' : 'Semua produk sudah ikut diskon coret')
                        : 'Tidak ada produk ditemukan'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredProducts.map(product => {
                      const isSelected = selectedIds.has(product.id);
                      return (
                        <button
                          key={product.id}
                          onClick={() => toggleSelect(product.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                            isSelected
                              ? `${isDiscount ? 'bg-rose-50 border-rose-200' : 'bg-purple-50 border-purple-200'} border`
                              : 'bg-white border border-transparent hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? `${isDiscount ? 'bg-rose-500 border-rose-500' : 'bg-purple-500 border-purple-500'} text-white`
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative border border-ink/5">
                            {product.image_url ? (
                              <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="40px" />
                            ) : (
                              <Package size={16} className="absolute inset-0 m-auto text-ink/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{product.name}</p>
                            <p className="text-[10px] text-ink/40 uppercase tracking-wider">{product.category}</p>
                          </div>
                          <span className="text-xs font-mono font-semibold text-ink/70 flex-shrink-0">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-ink/40 uppercase tracking-widest">
                  {eligibleProducts.length} produk tersedia
                </span>
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedIds.size === 0}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDiscount
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/20'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20'
                  }`}
                >
                  Lanjut Konfigurasi →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURATION */}
          {step === 2 && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="px-6 py-4 flex-1 space-y-4">
                {/* Selected products chips */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold mb-2">
                    {selectedProducts.length} Produk Dipilih
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                    {selectedProducts.map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-200 text-[10px] font-medium text-ink/70">
                        {p.image_url && (
                          <div className="w-4 h-4 rounded overflow-hidden relative flex-shrink-0">
                            <Image src={p.image_url} alt="" fill className="object-cover" sizes="16px" />
                          </div>
                        )}
                        <span className="truncate max-w-[120px]">{p.name}</span>
                        <button onClick={() => toggleSelect(p.id)} className="text-ink/30 hover:text-red-500">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {isDiscount && (
                  <div className="space-y-3">
                    <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-rose-600 font-bold">Kalkulator Diskon Cepat</p>
                      <div className="flex flex-wrap gap-2">
                        {[10, 20, 30, 40, 50, 70].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setQuickDiscount(pct);
                              setDiscountConfig(prev => ({ ...prev, original_price: '' }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              quickDiscount === pct
                                ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                                : 'bg-white text-ink/70 border-gray-200 hover:border-rose-300 hover:text-rose-600'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      {quickDiscount && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">
                          Harga asli (sekarang) akan menjadi harga coret. Harga final = -{quickDiscount}% dari harga saat ini.
                        </p>
                      )}
                    </div>

                    {!quickDiscount && (
                      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                        <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-2">Atau Set Harga Coret Manual</p>
                        <input
                          type="number"
                          value={discountConfig.original_price}
                          onChange={e => {
                            setDiscountConfig(prev => ({ ...prev, original_price: e.target.value }));
                            setQuickDiscount(null);
                          }}
                          placeholder="Harga normal sebelum diskon (Rp)"
                          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs focus:outline-none focus:border-amber-400"
                        />
                        <p className="text-[9px] text-amber-600 mt-1">Harga final produk tetap menggunakan harga saat ini.</p>
                      </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold">Periode Diskon (Opsional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-ink/50 mb-1 font-semibold">Mulai</label>
                          <input
                            type="datetime-local"
                            value={discountConfig.discount_start_date}
                            onChange={e => setDiscountConfig(prev => ({ ...prev, discount_start_date: e.target.value }))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-rose/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-ink/50 mb-1 font-semibold">Berakhir</label>
                          <input
                            type="datetime-local"
                            value={discountConfig.discount_end_date}
                            onChange={e => setDiscountConfig(prev => ({ ...prev, discount_end_date: e.target.value }))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-rose/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isDiscount && (
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">Konfigurasi Volume Promo</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-purple-700/70 mb-1 font-semibold">Minimal Beli (Qty)</label>
                        <input
                          type="number"
                          min="2"
                          value={volumeConfig.bundle_min_qty}
                          onChange={e => setVolumeConfig(prev => ({ ...prev, bundle_min_qty: e.target.value }))}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-purple-700/70 mb-1 font-semibold">Total Diskon (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={volumeConfig.bundle_discount_amount}
                          onChange={e => setVolumeConfig(prev => ({ ...prev, bundle_discount_amount: e.target.value }))}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-purple-100">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[9px] text-ink/60 leading-relaxed">
                        Contoh: Jika Minimal Beli = <strong>2</strong> dan Total Diskon = <strong>Rp 25.000</strong>, maka pembeli mendapatkan potongan Rp 25.000 setiap kelipatan 2 item.
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {selectedProducts.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mb-2">Preview Perubahan</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                      {selectedProducts.slice(0, 5).map(p => {
                        let newPrice = p.price;
                        let strikePrice = p.price;
                        if (isDiscount) {
                          if (quickDiscount) {
                            strikePrice = p.price;
                            newPrice = Math.round(p.price * (1 - quickDiscount / 100));
                          } else if (discountConfig.original_price) {
                            strikePrice = parseInt(discountConfig.original_price);
                            newPrice = p.price;
                          }
                        }
                        return (
                          <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white">
                            <span className="text-[10px] font-medium text-ink truncate max-w-[200px]">{p.name}</span>
                            {isDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] line-through text-ink/40 font-mono">Rp {strikePrice.toLocaleString('id-ID')}</span>
                                <span className="text-[10px] font-bold text-rose font-mono">Rp {newPrice.toLocaleString('id-ID')}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-purple-600 font-bold">
                                Beli {volumeConfig.bundle_min_qty} → -Rp {parseInt(volumeConfig.bundle_discount_amount || '0').toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {selectedProducts.length > 5 && (
                        <p className="text-[9px] text-ink/40 text-center py-1">...dan {selectedProducts.length - 5} produk lainnya</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                {!editingProduct ? (
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-ink/60 hover:text-ink transition-colors uppercase tracking-wider"
                  >
                    ← Kembali
                  </button>
                ) : (
                  <div></div>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving || (isDiscount && !quickDiscount && !discountConfig.original_price)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDiscount
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/20'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20'
                  }`}
                >
                  {isSaving ? 'Menyimpan...' : `Terapkan ke ${selectedIds.size} Produk`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
