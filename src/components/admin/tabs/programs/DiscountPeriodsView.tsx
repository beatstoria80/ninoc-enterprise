import React, { useMemo, useCallback } from 'react';
import { Product } from '@/components/admin/types';
import Image from 'next/image';
import { Tag, Package, CheckCircle, Clock, XCircle, Plus, Trash2, Edit2 } from 'lucide-react';
import { isDiscountActive } from '@/lib/domain/product';
import { createClient } from '@/utils/supabase/client';

interface DiscountPeriodsViewProps {
  products: Product[];
  onCreatePromo: () => void;
  onRefresh: () => void;
}

function getDiscountStatus(product: Product): 'active' | 'pending' | 'expired' {
  if (isDiscountActive(product)) return 'active';
  
  const now = new Date();
  const start = product.discount_start_date ? new Date(product.discount_start_date) : null;
  if (start && now < start) return 'pending';
  return 'expired';
}

const STATUS_CONFIG = {
  active:  { label: 'Aktif',      className: 'bg-emerald-50 text-emerald-600', icon: CheckCircle, sortOrder: 0 },
  pending: { label: 'Mendatang',  className: 'bg-amber-50 text-amber-600',     icon: Clock,       sortOrder: 1 },
  expired: { label: 'Berakhir',   className: 'bg-gray-100 text-gray-500',      icon: XCircle,     sortOrder: 2 },
} as const;

export default function DiscountPeriodsView({ products, onCreatePromo, onRefresh }: DiscountPeriodsViewProps) {
  const supabase = createClient();

  const discountProducts = useMemo(() => {
    return products
      .filter((p) => p.original_price != null && p.original_price > 0)
      .map((p) => ({ ...p, _status: getDiscountStatus(p) }))
      .sort((a, b) => STATUS_CONFIG[a._status].sortOrder - STATUS_CONFIG[b._status].sortOrder);
  }, [products]);

  const stats = useMemo(() => {
    let active = 0, pending = 0, expired = 0;
    for (const p of discountProducts) {
      if (p._status === 'active') active++;
      else if (p._status === 'pending') pending++;
      else expired++;
    }
    return { total: discountProducts.length, active, pending, expired };
  }, [discountProducts]);

  const handleStopDiscount = useCallback(async (product: Product) => {
    if (!confirm(`Hentikan diskon untuk "${product.name}"? Harga akan dikembalikan ke harga coret (Rp ${product.original_price?.toLocaleString('id-ID')}).`)) return;

    await supabase.from('products').update({
      price: product.original_price,
      original_price: null,
      discount_start_date: null,
      discount_end_date: null,
    }).eq('id', product.id);

    onRefresh();
  }, [supabase, onRefresh]);

  return (
    <div className="flex flex-col h-full space-y-1 md:space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-3">
        <div className="bg-rose/5 border border-rose/10 p-2 md:p-3 rounded-lg md:rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-rose/60 font-semibold mb-0.5">Total Produk Diskon</p>
            <p className="text-xl md:text-2xl font-display font-semibold italic text-rose">{stats.total}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose/10 flex items-center justify-center text-rose">
            <Tag size={16} className="md:w-[18px] md:h-[18px]" />
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-2 md:p-3 rounded-lg md:rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600/60 font-semibold mb-0.5">Sedang Aktif</p>
            <p className="text-xl md:text-2xl font-display font-semibold italic text-emerald-700">{stats.active}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle size={16} className="md:w-[18px] md:h-[18px]" />
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-2 md:p-3 rounded-lg md:rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-amber-600/60 font-semibold mb-0.5">Mendatang / Berakhir</p>
            <p className="text-xl md:text-2xl font-display font-semibold italic text-amber-700">{stats.pending + stats.expired}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={16} className="md:w-[18px] md:h-[18px]" />
          </div>
        </div>
        {/* CREATE PROMO BUTTON */}
        <button
          onClick={onCreatePromo}
          className="bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white p-2 md:p-3 rounded-lg md:rounded-xl flex items-center justify-between transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98] col-span-2 md:col-span-1"
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold mb-0.5">Tambah Produk</p>
            <p className="text-sm font-display font-semibold italic uppercase">+ Buat Promo</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Plus size={20} strokeWidth={3} className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-ink/10 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
            <thead className="bg-gray-50 border-b border-ink/5 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Produk</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Harga Normal</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Harga Diskon</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Jadwal Periode</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {discountProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink/40">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs uppercase tracking-widest font-medium">Tidak ada produk diskon</p>
                    <p className="text-[10px] text-ink/30 mt-1">Klik &quot;+ Buat Promo&quot; untuk menambahkan produk ke program diskon</p>
                  </td>
                </tr>
              ) : (
                discountProducts.map((product) => {
                  const start = product.discount_start_date ? new Date(product.discount_start_date) : null;
                  const end = product.discount_end_date ? new Date(product.discount_end_date) : null;
                  const statusCfg = STATUS_CONFIG[product._status];
                  const discountPct = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-2 py-1.5 md:px-4 md:py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative border border-ink/5">
                            {product.image_url ? (
                              <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="40px" />
                            ) : (
                              <Package size={16} className="absolute inset-0 m-auto text-ink/20" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-ink truncate max-w-[200px]">{product.name}</p>
                            <p className="text-[10px] text-ink/40 uppercase tracking-wider mt-0.5">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 md:px-4 md:py-2.5">
                        <span className="text-[11px] font-medium text-ink/60 line-through">
                          Rp {product.original_price?.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 md:px-4 md:py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-rose">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                          {discountPct > 0 && (
                            <span className="text-[9px] font-bold text-white bg-rose px-1.5 py-0.5 rounded">-{discountPct}%</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 md:px-4 md:py-2.5" suppressHydrationWarning>
                        <div className="flex flex-col gap-0.5">
                          {start || end ? (
                            <>
                              <div className="flex items-center gap-1 text-[10px] text-ink/70">
                                <span className="w-8 uppercase text-ink/40">Mulai</span>
                                <span className="font-medium">{start ? start.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Sekarang'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-ink/70">
                                <span className="w-8 uppercase text-ink/40">Akhir</span>
                                <span className="font-medium">{end ? end.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Selamanya'}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-ink/50 italic">Tidak ada batas waktu</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 md:px-4 md:py-2.5">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 md:px-4 md:py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditPromo(product)}
                            title="Edit Diskon"
                            className="p-1.5 rounded-lg text-ink/40 hover:text-blue-500 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleStopDiscount(product)}
                            title="Hentikan Diskon"
                            className="p-1.5 rounded-lg text-ink/20 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
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
      </div>
    </div>
  );
}
