'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Play, Square, Save, X, Search, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlashSaleManager } from '@/hooks/admin/useFlashSaleManager';

export function FlashSaleTab() {
  const { state, actions } = useFlashSaleManager();
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    actions.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Flash Sale Manager</h2>
          <p className="text-xs text-ink/60 mt-1">Atur kampanye diskon waktu terbatas dan reservasi stok khusus.</p>
        </div>
        <button
          onClick={actions.openNewSale}
          className="flex items-center gap-2 px-3 py-1.5 bg-ink text-white rounded hover:bg-ink/90 transition-colors text-xs font-medium"
        >
          <Plus size={14} /> Buat Flash Sale Baru
        </button>
      </div>

      <div className="bg-white border border-ink/5 rounded-lg overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[600px]">
          <thead className="bg-ink/[0.02] text-ink/60 border-b border-ink/5 uppercase tracking-wider font-medium text-[10px]">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Nama Kampanye</th>
              <th className="px-4 py-3">Mulai</th>
              <th className="px-4 py-3">Berakhir</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {state.loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Memuat data...</td></tr>
            ) : state.sales.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Belum ada Flash Sale. Buat kampanye pertama Anda!</td></tr>
            ) : (
              state.sales.map(s => {
                const now = new Date().getTime();
                const start = new Date(s.start_time).getTime();
                const end = new Date(s.end_time).getTime();
                const isRunning = s.is_active && now >= start && now <= end;
                const isUpcoming = s.is_active && now < start;
                
                return (
                  <tr key={s.id} className="hover:bg-ink/[0.01]">
                    <td className="px-4 py-3">
                      {!s.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold uppercase">Non-Aktif</span>
                      ) : isRunning ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose/10 text-rose text-[9px] font-bold uppercase animate-pulse">Berjalan</span>
                      ) : isUpcoming ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold uppercase">Akan Datang</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold uppercase">Berakhir</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">{s.title}</td>
                    <td className="px-4 py-3 font-mono text-ink/80">{new Date(s.start_time).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 font-mono text-ink/80">{new Date(s.end_time).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => actions.toggleActive(s.id, s.is_active)} className={`p-1.5 rounded hover:bg-ink/5 ${s.is_active ? 'text-amber-500' : 'text-emerald-500'}`} title={s.is_active ? "Nonaktifkan" : "Aktifkan"}>
                          {s.is_active ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                        <button onClick={() => actions.openEditSale(s)} className="p-1.5 text-ink/60 hover:text-ink hover:bg-ink/5 rounded" title="Edit Kampanye & Produk">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => actions.deleteSale(s.id)} className="p-1.5 text-rose/60 hover:text-rose hover:bg-rose/5 rounded" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {state.isModalOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pt-20 pb-10">
            <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => actions.setIsModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col relative z-10"
            >
              <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-semibold text-ink">{state.isEditing ? 'Edit Flash Sale' : 'Buat Flash Sale Baru'}</h3>
                <button onClick={() => actions.setIsModalOpen(false)} className="text-ink/40 hover:text-ink"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 custom-scrollbar">
                
                {/* SETTINGS PANEL */}
                <div className="space-y-4 md:col-span-1 border-r border-ink/5 pr-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1.5">Nama Kampanye</label>
                    <input type="text" value={state.form.title} onChange={e => actions.setForm({...state.form, title: e.target.value})} className="w-full border border-ink/10 rounded px-2.5 py-1.5 text-xs focus:border-rose focus:ring-1 focus:ring-rose" placeholder="Contoh: Harbolnas 12.12" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1.5">Waktu Mulai</label>
                    <input type="datetime-local" value={state.form.start_time} onChange={e => actions.setForm({...state.form, start_time: e.target.value})} className="w-full border border-ink/10 rounded px-2.5 py-1.5 text-xs focus:border-rose focus:ring-1 focus:ring-rose" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1.5">Waktu Selesai</label>
                    <input type="datetime-local" value={state.form.end_time} onChange={e => actions.setForm({...state.form, end_time: e.target.value})} className="w-full border border-ink/10 rounded px-2.5 py-1.5 text-xs focus:border-rose focus:ring-1 focus:ring-rose" />
                  </div>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={state.form.is_active} onChange={e => actions.setForm({...state.form, is_active: e.target.checked})} className="accent-rose w-4 h-4 rounded border-ink/20" />
                      <span className="text-xs font-medium text-ink">Status Aktif (On/Off)</span>
                    </label>
                  </div>
                  
                  <button onClick={actions.saveSale} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-ink text-white rounded text-xs font-medium hover:bg-ink/90 transition-all">
                    <Save size={14} /> Simpan Pengaturan
                  </button>
                </div>

                {/* ITEMS PANEL */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Produk Terdaftar</h4>
                    <button onClick={() => setShowProductSearch(!showProductSearch)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose hover:bg-rose/5 px-2 py-1 rounded">
                      <Plus size={12} /> Tambah Produk
                    </button>
                  </div>

                  {showProductSearch && (
                    <div className="bg-ink/[0.02] border border-ink/5 p-3 rounded-lg mb-4">
                      <div className="relative mb-3">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40" />
                        <input type="text" placeholder="Cari nama produk..." value={state.searchQuery} onChange={e => actions.setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs border border-ink/10 rounded bg-white" />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                        {state.filteredProducts.map(p => (
                          <div key={p.id} className="flex flex-col gap-1 border-b border-ink/5 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-ink">{p.name} <span className="text-ink/40 text-[9px] ml-1">Rp{(p.price || 0).toLocaleString()}</span></span>
                              {(!p.variants || p.variants.length === 0) && (
                                <button onClick={() => actions.addItem(p, null, () => setShowProductSearch(false))} className="text-[9px] font-bold bg-rose text-white px-2 py-0.5 rounded uppercase">Pilih</button>
                              )}
                            </div>
                            {p.variants && p.variants.length > 0 && (
                              <div className="pl-3 space-y-1 border-l-2 border-rose/20">
                                {p.variants.map((v: any) => (
                                  <div key={v.id} className="flex justify-between items-center text-[10px] text-ink/80">
                                    <span>{[v.size, v.color].filter(Boolean).join(' - ')}</span>
                                    <button onClick={() => actions.addItem(p, v, () => setShowProductSearch(false))} className="text-[9px] font-bold border border-rose text-rose px-2 py-0.5 rounded uppercase hover:bg-rose hover:text-white">Pilih Varian</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!state.form.id ? (
                    <div className="p-6 border border-dashed border-ink/10 rounded-lg text-center text-ink/40 text-xs">
                      <Package size={24} className="mx-auto mb-2 opacity-50" />
                      Simpan jadwal dan pengaturan promo di panel kiri terlebih dahulu sebelum menambahkan produk.
                    </div>
                  ) : state.items.length === 0 ? (
                    <div className="p-6 border border-dashed border-ink/10 rounded-lg text-center text-ink/40 text-xs">
                      Belum ada produk yang didaftarkan untuk promo ini.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {state.items.map(item => (
                        <div key={item.id} className="p-2.5 border border-ink/10 rounded bg-white flex items-center justify-between gap-4 shadow-sm hover:border-ink/20 transition-all">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{item.products?.name}</p>
                            <p className="text-[10px] text-ink/60 uppercase">
                              {item.variants ? [item.variants.size, item.variants.color].filter(Boolean).join(' - ') : 'ALL VARIANTS'}
                              <span className="mx-2 text-ink/20">|</span> 
                              Normal: Rp{Number(item.products?.price || 0).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0 bg-ink/[0.02] p-1.5 rounded-lg border border-ink/5">
                            <div>
                              <label className="block text-[8px] uppercase tracking-wider text-ink/60 font-bold mb-0.5">Harga Flash Sale</label>
                              <input type="number" value={item.flash_sale_price} onChange={(e) => actions.updateItem(item.id, 'flash_sale_price', Number(e.target.value))} className="w-24 px-1.5 py-1 text-xs border border-ink/10 rounded font-mono text-rose" />
                            </div>
                            <div>
                              <label className="block text-[8px] uppercase tracking-wider text-ink/60 font-bold mb-0.5">Alokasi Stok</label>
                              <input type="number" value={item.allocated_stock} onChange={(e) => actions.updateItem(item.id, 'allocated_stock', Number(e.target.value))} className="w-16 px-1.5 py-1 text-xs border border-ink/10 rounded font-mono" />
                            </div>
                            <div>
                              <label className="block text-[8px] uppercase tracking-wider text-ink/60 font-bold mb-0.5">Max Qty/User</label>
                              <input type="number" value={item.max_qty_per_user} onChange={(e) => actions.updateItem(item.id, 'max_qty_per_user', Number(e.target.value))} className="w-16 px-1.5 py-1 text-xs border border-ink/10 rounded font-mono" />
                            </div>
                            <button onClick={() => actions.deleteItem(item.id)} className="p-1.5 text-rose/50 hover:text-rose hover:bg-rose/10 rounded ml-1" title="Hapus Produk dari Promo">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
