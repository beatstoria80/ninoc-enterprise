import React from 'react';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Product } from '../types';

export function InventoryTab({ products }: { products: Product[] }) {
  const totalProducts = products.length;
  let totalSkus = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  
  products.forEach(p => {
    if (p.variants) {
      totalSkus += p.variants.length;
      p.variants.forEach(v => {
        if (v.stock_quantity === 0) outOfStockCount++;
        else if (v.stock_quantity < 5) lowStockCount++;
      });
    }
  });

  return (
    <motion.div
      key="inventory"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full pb-4 space-y-5"
    >
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-ink uppercase tracking-wide">Archival Catalog</h2>
          <span className="text-[9px] text-ink/40">— stock & origin specification</span>
        </div>
      </div>

      {/* METRICS CELL-BLOCK */}
      <div className="shrink-0 grid grid-cols-4 border border-ink/10 bg-white">
        {[
          { label: 'Total Articles', value: totalProducts, highlight: false },
          { label: 'Total SKUs', value: totalSkus, highlight: false },
          { label: 'Low Stock Alert', value: lowStockCount, highlight: lowStockCount > 0 },
          { label: 'Out of Stock', value: outOfStockCount, highlight: outOfStockCount > 0, critical: true }
        ].map((m, i) => (
          <div key={i} className={cn("px-4 py-3", i < 3 && "border-r border-ink/10")}>
            <p className="text-[8px] uppercase tracking-[0.2em] text-ink/40 mb-1">{m.label}</p>
            <p className={cn("text-sm font-medium font-mono", m.critical ? "text-rose" : m.highlight ? "text-amber-600" : "text-ink")}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* PRODUCTS LIST */}
      <div className="flex-1 min-h-0 overflow-y-auto minimal-scroll space-y-4 pr-1">
        {products.map(p => {
          const pTotalStock = p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;
          return (
            <div key={p.id} className="border border-ink/10 bg-white flex flex-col">
              {/* Parent Product Info */}
              <div className="flex items-center justify-between p-3 bg-ink/[0.02] border-b border-ink/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-ink/5 border border-ink/10 flex items-center justify-center shrink-0">
                    {p.image_url ? <Image src={p.image_url} alt={p.name || 'Product image'} width={40} height={40} className="object-cover" /> : <Box size={16} className="text-ink/20" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-ink uppercase tracking-wider">{p.name}</p>
                    <p className="text-[9px] text-ink/40 uppercase tracking-widest mt-0.5">{p.category} • {p.variants?.length || 0} SKUs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-ink/40 mb-0.5">Total Quantity</p>
                  <p className="text-[11px] font-mono font-medium text-ink">{pTotalStock}</p>
                </div>
              </div>

              {/* Variants Grid */}
              {p.variants && p.variants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                  {p.variants.map((v, vIdx) => {
                    const isOOS = v.stock_quantity === 0;
                    const isLow = v.stock_quantity > 0 && v.stock_quantity < 5;
                    return (
                      <div key={v.id || vIdx} className={cn(
                        "flex items-center justify-between p-3 border-b border-r border-ink/5",
                        isOOS ? "bg-rose/5" : "bg-white hover:bg-ink/[0.01] transition-colors"
                      )}>
                        <div>
                          <p className="text-[10px] font-medium text-ink uppercase">Size: {v.size || 'OS'} / Color: {v.color || '-'}</p>
                          <p className="text-[8px] font-mono text-ink/40 mt-1">ID: {v.id?.slice(0, 8) || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-[12px] font-mono font-medium",
                            isOOS ? "text-rose" : isLow ? "text-amber-600" : "text-ink"
                          )}>
                            {v.stock_quantity}
                          </p>
                          <p className={cn(
                            "text-[7px] uppercase tracking-widest mt-0.5 font-medium",
                            isOOS ? "text-rose" : isLow ? "text-amber-600" : "text-ink/40"
                          )}>
                            {isOOS ? 'OOS' : isLow ? 'LOW' : 'STOCK'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-center text-[9px] text-ink/30 uppercase tracking-widest">
                  No Origin Specifications (Variants)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
