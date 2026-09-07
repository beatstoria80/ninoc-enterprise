import React, { useMemo } from 'react';
import { Product } from '@/components/admin/types';
import Image from 'next/image';
import { PackagePlus, Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface VolumePromosViewProps {
  products: Product[];
}

export default function VolumePromosView({ products }: VolumePromosViewProps) {
  const bundleProducts = useMemo(() => {
    return products
      .filter((p) => p.bundle_min_qty != null && p.bundle_min_qty > 0 && p.bundle_discount_amount != null && p.bundle_discount_amount > 0)
      .sort((a, b) => {
        // Active first, conflicted last
        const aConflict = a.original_price ? 1 : 0;
        const bConflict = b.original_price ? 1 : 0;
        if (aConflict !== bConflict) return aConflict - bConflict;
        return (b.bundle_discount_amount || 0) - (a.bundle_discount_amount || 0);
      });
  }, [products]);

  const stats = useMemo(() => {
    let active = 0, conflict = 0;
    for (const p of bundleProducts) {
      if (p.original_price) conflict++;
      else active++;
    }
    return { total: bundleProducts.length, active, conflict };
  }, [bundleProducts]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Stats — fill all 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-purple-700/60 font-semibold mb-0.5">Total Promo Grosir</p>
            <p className="text-2xl font-display font-semibold italic text-purple-700">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
            <PackagePlus size={18} />
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600/60 font-semibold mb-0.5">Aktif (Tanpa Konflik)</p>
            <p className="text-2xl font-display font-semibold italic text-emerald-700">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle size={18} />
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-red-600/60 font-semibold mb-0.5">Nonaktif (Konflik Diskon)</p>
            <p className="text-2xl font-display font-semibold italic text-red-600">{stats.conflict}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={18} />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-ink/10 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-ink/5 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Produk</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Harga Satuan</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Syarat Pembelian</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Total Diskon (Rp)</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Status Promo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {bundleProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-ink/40">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs uppercase tracking-widest font-medium">Tidak ada promo volume/grosir</p>
                  </td>
                </tr>
              ) : (
                bundleProducts.map((product) => {
                  const hasConflict = !!product.original_price;

                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${hasConflict ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5">
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
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-semibold text-ink/80">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                          Minimal Beli {product.bundle_min_qty}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-bold text-emerald-600">
                          - Rp {product.bundle_discount_amount?.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {hasConflict ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-600 w-fit">
                              Nonaktif (Konflik)
                            </span>
                            <span className="text-[9px] text-ink/40">Diskon Coret sedang aktif</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600">
                            Aktif
                          </span>
                        )}
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
