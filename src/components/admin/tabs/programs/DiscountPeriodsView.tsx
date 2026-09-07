import React, { useMemo } from 'react';
import { Product } from '@/types/shop';
import Image from 'next/image';
import { Tag, CalendarClock, ExternalLink, Package } from 'lucide-react';

interface DiscountPeriodsViewProps {
  products: Product[];
}

export default function DiscountPeriodsView({ products }: DiscountPeriodsViewProps) {
  // Filter products that have original_price set
  const discountProducts = useMemo(() => {
    return products.filter((p) => p.original_price != null && p.original_price > 0)
      .sort((a, b) => {
        // Sort by those currently active, then by those upcoming, then by those expired
        const now = new Date();
        const aStart = a.discount_start_date ? new Date(a.discount_start_date) : null;
        const bStart = b.discount_start_date ? new Date(b.discount_start_date) : null;
        return (aStart?.getTime() || 0) - (bStart?.getTime() || 0);
      });
  }, [products]);

  const now = new Date();

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-rose/5 border border-rose/10 p-3 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-rose/60 font-semibold mb-0.5">Total Produk Diskon</p>
            <p className="text-2xl font-display font-semibold italic text-rose">{discountProducts.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center text-rose">
            <Tag size={18} />
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
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Harga Normal</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Harga Diskon</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Jadwal Periode</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {discountProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-ink/40">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs uppercase tracking-widest font-medium">Tidak ada produk diskon</p>
                  </td>
                </tr>
              ) : (
                discountProducts.map((product) => {
                  const start = product.discount_start_date ? new Date(product.discount_start_date) : null;
                  const end = product.discount_end_date ? new Date(product.discount_end_date) : null;
                  const isActive = (!start || now >= start) && (!end || now <= end);
                  const isPending = start && now < start;
                  const isExpired = end && now > end;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative border border-ink/5">
                            {product.image_url ? (
                              <Image src={product.image_url} alt={product.name} fill className="object-cover" />
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
                        <span className="text-[11px] font-medium text-ink/60 line-through">
                          Rp {product.original_price?.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-semibold text-rose">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
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
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                          isActive ? 'bg-emerald-50 text-emerald-600' :
                          isPending ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {isActive ? 'Aktif' : isPending ? 'Mendatang' : 'Berakhir'}
                        </span>
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
