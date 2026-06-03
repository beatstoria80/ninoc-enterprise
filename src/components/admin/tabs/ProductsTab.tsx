import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package, Eye, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Product } from '../types';

export function ProductsTab({
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
    <motion.div
      key="products"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Products</h2>
          <span className="text-[9px] text-gray-400">— {products.length} items</span>
        </div>
        <button
          onClick={() => openProductModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose text-white rounded hover:bg-rose/90 transition-colors"
        >
          <Plus size={12} />
          <span className="text-[9px] uppercase tracking-wider">Add</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
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
              {product.is_featured && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-rose text-white text-[8px] uppercase tracking-wider rounded">
                  Featured
                </div>
              )}
            </div>
            <div className="p-3 space-y-2">
              {/* Product Name */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-medium italic text-xs text-ink leading-tight truncate">{product.name}</h3>
                {product.is_featured && (
                  <span className="shrink-0 px-1.5 py-0.5 bg-rose text-white text-[8px] uppercase tracking-wider rounded">Featured</span>
                )}
              </div>

              {/* Category + Variants */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-gray-400">{product.category}</span>
                <span className="text-[9px] text-rose">{product.variants?.length || 0} variants</span>
              </div>

              {/* Price */}
              <div className="space-y-0.5">
                {product.price_tag && (
                  <div className="text-[8px] uppercase tracking-[0.25em] text-rose font-medium">{product.price_tag}</div>
                )}
                <p className="text-sm font-medium text-ink leading-none">
                  {Number(product.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-[9px] font-normal text-gray-400 ml-1">IDR</span>
                </p>
                <div className="pt-2 mt-2 border-t border-ink/5">
                  <p className="text-[8px] text-gray-400 uppercase flex justify-between">
                    <span>VAT (11%)</span>
                    <span>+ {Math.round(Number(product.price) * 0.11).toLocaleString('id-ID')} IDR</span>
                  </p>
                  <p className="text-[10px] font-medium text-ink flex justify-between mt-1">
                    <span>TOTAL</span>
                    <span className="text-rose italic font-display">{Math.round(Number(product.price) * 1.11).toLocaleString('id-ID')} IDR</span>
                  </p>
                </div>
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
                        <span className="text-[8px] text-gray-400 uppercase">Colors:</span>
                        {colors.map(c => (
                          <span key={c} className="px-1.5 py-0.5 bg-ink/5 text-[8px] text-ink rounded">{c}</span>
                        ))}
                      </div>
                    )}
                    {sizes.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] text-gray-400 uppercase">Sizes:</span>
                        {sizes.map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-[8px] text-gray-600 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-gray-400 uppercase">Total Stock</span>
                      <span className={cn(
                        "text-[10px] font-medium",
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
    </motion.div>
  );
}
