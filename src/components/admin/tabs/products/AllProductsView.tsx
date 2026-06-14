import React from 'react';
import Image from 'next/image';
import { Package, Eye, Edit2, Trash2, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '../../types';

export function AllProductsView({
  products,
  searchQuery,
  setSearchQuery,
  openProductModal,
  toggleFeatured,
  deleteProduct
}: {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openProductModal: (p?: Product) => void;
  toggleFeatured: (p: Product) => void;
  deleteProduct: (id: string) => void;
}) {
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search */}
      <div className="shrink-0 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
        />
      </div>

      {/* Products Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto minimal-scroll pb-4 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
              <div className="aspect-square bg-gray-50 relative">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={40} className="text-gray-200" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleFeatured(product)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      product.is_featured ? "bg-rose text-white" : "bg-white/90 text-gray-600"
                    )}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => openProductModal(product)}
                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-rose hover:text-white"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {product.is_featured && (
                    <div className="w-fit px-2 py-1 bg-rose text-white text-[11px] md:text-[8px] uppercase tracking-wider rounded shadow-sm">
                      Featured
                    </div>
                  )}
                  {product.affiliate_eligible && (
                    <div className="w-fit px-2 py-1 bg-emerald-500 text-white text-[11px] md:text-[8px] uppercase tracking-wider rounded shadow-sm">
                      Affiliate
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2">
                {/* Product Name */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-medium italic text-xs text-ink leading-tight line-clamp-2">{product.name}</h3>
                  <div className="shrink-0 flex flex-wrap justify-end gap-1">
                    {product.is_featured && (
                      <span className="px-1.5 py-0.5 bg-rose text-white text-[11px] md:text-[8px] uppercase tracking-wider rounded">Featured</span>
                    )}
                    {product.affiliate_eligible && (
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[11px] md:text-[8px] uppercase tracking-wider rounded">Affiliate</span>
                    )}
                  </div>
                </div>

                {/* Category + Variants + SKU Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-[9px] uppercase tracking-widest text-gray-400">{product.category}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs md:text-[9px] text-rose">{product.variants?.length || 0} variants</span>
                    {product.variants && product.variants.length > 0 && product.variants.every(v => v.sku && v.sku.trim() !== '') ? (
                      <div className="flex items-center gap-0.5 text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-1 py-0.5 border border-emerald-100/50 rounded-sm" title="All variants have SKU">
                        <CheckCircle2 size={8} /> <span className="hidden 2xl:inline-block">Verified</span>
                      </div>
                    ) : product.variants && product.variants.length > 0 ? (
                      <div className="flex items-center gap-0.5 text-[10px] md:text-[7px] font-medium uppercase tracking-[0.2em] text-rose bg-rose/5 px-1 py-0.5 border border-rose/10 rounded-sm" title="Missing SKU">
                        <AlertCircle size={8} />
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-0.5">
                  {product.price_tag && (
                    <div className="text-[11px] md:text-[8px] uppercase tracking-[0.25em] text-rose font-medium">{product.price_tag}</div>
                  )}
                  <p className="text-sm font-medium text-ink leading-none">
                    {Number(product.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    <span className="text-xs md:text-[9px] font-normal text-gray-400 ml-1">IDR</span>
                  </p>
                </div>

                {/* Color/Sizes breakdown */}
                {product.variants && product.variants.length > 0 && (() => {
                  const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))] as string[];
                  const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[];
                  const totalStock = product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
                  return (
                    <div className="pt-1 border-t border-ink/5 space-y-1">
                      {colors.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] md:text-[8px] text-gray-400 uppercase">Colors:</span>
                          {colors.map(c => (
                            <span key={c} className="px-1.5 py-0.5 bg-ink/5 text-[11px] md:text-[8px] text-ink rounded">{c}</span>
                          ))}
                        </div>
                      )}
                      {sizes.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] md:text-[8px] text-gray-400 uppercase">Sizes:</span>
                          {sizes.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-[11px] md:text-[8px] text-gray-600 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] md:text-[8px] text-gray-400 uppercase">Total Stock</span>
                        <span className={cn(
                          "text-xs md:text-[10px] font-medium",
                          totalStock === 0 ? "text-red-500" : totalStock < 5 ? "text-amber-500" : "text-emerald-600"
                        )}>{totalStock} units</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Image indicators */}
                {(product.perspective1 || product.perspective2 || product.perspective3 || product.perspective4) && (
                  <div className="flex items-center gap-1">
                    {[product.perspective1, product.perspective2, product.perspective3, product.perspective4].filter(Boolean).map((_, idx) => (
                      <div key={idx} className="w-4 h-4 rounded-sm bg-rose/20 border border-rose/20 flex items-center justify-center">
                        <span className="text-[6px] text-rose">{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
