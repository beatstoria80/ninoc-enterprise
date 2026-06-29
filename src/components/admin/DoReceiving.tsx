import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, CheckCircle, Package, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function DoReceiving() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showQcModal, setShowQcModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // QC Form states
  const [qtyGood, setQtyGood] = useState<number | ''>('');
  const [qtyReject, setQtyReject] = useState<number | ''>('');
  const [qcNotes, setQcNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingPos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, po_items(*, product_variants(*, products(name)))')
      .neq('status', 'received')
      .order('created_at', { ascending: false });
    if (data) setPos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingPos();
  }, [fetchPendingPos]);

  const openQcModal = (po: any, item: any) => {
    setSelectedItem({ po, item });
    setQtyGood('');
    setQtyReject(0); // Default to 0 reject
    setQcNotes('');
    setShowQcModal(true);
  };

  const handleReceiveItem = async () => {
    if (!selectedItem) return;
    
    const good = Number(qtyGood) || 0;
    const reject = Number(qtyReject) || 0;
    const total = good + reject;
    
    if (total <= 0) {
      alert('Total barang yang diterima harus lebih dari 0.');
      return;
    }

    const { po, item } = selectedItem;
    const qtyRemaining = item.qty_ordered - (item.qty_received || 0);

    if (total > qtyRemaining) {
      alert(`Validasi Gagal: Jumlah total (${total}) melebihi sisa pesanan yang harus diterima (${qtyRemaining}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/wms/inbound-qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: po.id,
          po_item_id: item.id,
          variant_id: item.variant_id,
          qty_good: good,
          qty_reject: reject,
          notes: qcNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses penerimaan QC');

      alert('Berhasil! Stok masuk dan tercatat di sistem.');
      setShowQcModal(false);
      fetchPendingPos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-ink">Inbound Receiving & QC</h2>
          <p className="text-sm text-gray-500">Penerimaan barang dari PO (Delivery Order) beserta Quality Control.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500">Memuat data pesanan masuk...</div>
      ) : (
        <div className="grid gap-6">
          {pos.map(po => {
            const allItemsReceived = po.po_items?.every((i: any) => i.qty_received >= i.qty_ordered);
            if (allItemsReceived) return null; // Sembunyikan yang sudah 100% komplit

            return (
              <div key={po.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-lg text-ink font-mono">{po.po_number}</h3>
                    <p className="text-sm text-gray-600 font-medium">Vendor: <span className="uppercase text-ink">{po.vendor_name}</span></p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest rounded-md flex items-center gap-2">
                    <Truck size={14} /> {po.status === 'draft' ? 'Menunggu Pengiriman' : 'Diterima Sebagian'}
                  </span>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-gray-500 uppercase text-[10px] tracking-widest font-bold">
                    <tr>
                      <th className="py-3 px-4 rounded-l-md">Produk / Varian</th>
                      <th className="py-3 px-4 text-center">Dipesan</th>
                      <th className="py-3 px-4 text-center">Sisa</th>
                      <th className="py-3 px-4 text-right rounded-r-md">Aksi QC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {po.po_items?.map((item: any) => {
                      const qtyRemaining = item.qty_ordered - (item.qty_received || 0);
                      const isFullyReceived = qtyRemaining <= 0;
                      
                      return (
                        <tr key={item.id} className={isFullyReceived ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50/50 transition-colors'}>
                          <td className="py-4 px-4">
                            <p className="font-bold text-ink">{item.product_variants?.products?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Size: <span className="font-medium text-gray-700">{item.product_variants?.size || '-'}</span> | Color: <span className="font-medium text-gray-700">{item.product_variants?.color || '-'}</span></p>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-gray-600">{item.qty_ordered}</td>
                          <td className="py-4 px-4 text-center font-bold text-ink">{qtyRemaining > 0 ? qtyRemaining : 0}</td>
                          <td className="py-4 px-4 text-right">
                            {isFullyReceived ? (
                              <span className="inline-flex items-center justify-end gap-1.5 text-emerald-600 text-xs font-bold w-full">
                                <CheckCircle size={16} /> Komplit
                              </span>
                            ) : (
                              <button 
                                onClick={() => openQcModal(po, item)}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-indigo-700 transition-colors shadow-sm active:scale-95 flex items-center gap-2 ml-auto"
                              >
                                <Package size={14} /> Audit Masuk
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          {pos.filter(po => !po.po_items?.every((i: any) => i.qty_received >= i.qty_ordered)).length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <Truck size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-bold text-lg">Tidak ada Inbound tertunda.</p>
              <p className="text-gray-400 text-sm mt-1">Semua Delivery Order telah selesai diproses.</p>
            </div>
          )}
        </div>
      )}

      {/* QC AUDIT MODAL */}
      <AnimatePresence>
        {showQcModal && selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Audit Barang Masuk</h2>
                  <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-widest">{selectedItem.po.po_number}</p>
                </div>
                <button onClick={() => setShowQcModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">Target Varian</p>
                  <p className="font-bold text-indigo-900 text-lg leading-tight">{selectedItem.item.product_variants?.products?.name}</p>
                  <p className="text-sm font-medium text-indigo-700 mt-1">Size: {selectedItem.item.product_variants?.size || '-'} | Color: {selectedItem.item.product_variants?.color || '-'}</p>
                  <div className="mt-3 pt-3 border-t border-indigo-200/50 flex justify-between items-center">
                    <span className="text-xs text-indigo-600 font-medium">Sisa Pesanan Harus Diterima:</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {selectedItem.item.qty_ordered - (selectedItem.item.qty_received || 0)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Qty Layak Jual</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0"
                        value={qtyGood}
                        onChange={e => setQtyGood(e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full pl-4 pr-10 py-3 bg-white border-2 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-xl font-bold text-emerald-900 outline-none transition-all placeholder:text-emerald-200"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                        <CheckCircle size={20} />
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-1.5 font-medium leading-tight">Barang ini akan langsung masuk ke stok utama.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">Qty Cacat / Afkir</label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="0"
                        value={qtyReject}
                        onChange={e => setQtyReject(e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full pl-4 pr-10 py-3 bg-white border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl text-xl font-bold text-rose-900 outline-none transition-all placeholder:text-rose-200"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400">
                        <AlertCircle size={20} />
                      </div>
                    </div>
                    <p className="text-[10px] text-rose-600 mt-1.5 font-medium leading-tight">Barang tidak akan dijual. Dicatat sebagai kerugian/retur supplier.</p>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Catatan Audit (Opsional)</label>
                  <textarea 
                    value={qcNotes}
                    onChange={e => setQcNotes(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm text-gray-900 outline-none transition-all resize-none"
                    placeholder="Tulis alasan jika ada barang cacat (misal: kardus rusak, dll)..."
                  />
                </div>
                
                {/* Real-time Validation Warning */}
                {((Number(qtyGood) || 0) + (Number(qtyReject) || 0)) > (selectedItem.item.qty_ordered - (selectedItem.item.qty_received || 0)) && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-bold flex gap-2 mt-4 animate-pulse">
                    <AlertCircle size={16} className="shrink-0" />
                    Total penerimaan melebihi sisa pesanan PO! Harap kurangi jumlahnya.
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button 
                  onClick={() => setShowQcModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleReceiveItem}
                  disabled={isSubmitting || (((Number(qtyGood) || 0) + (Number(qtyReject) || 0)) > (selectedItem.item.qty_ordered - (selectedItem.item.qty_received || 0))) || ((Number(qtyGood) || 0) + (Number(qtyReject) || 0) <= 0)}
                  className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package size={16} />}
                  Simpan Penerimaan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

