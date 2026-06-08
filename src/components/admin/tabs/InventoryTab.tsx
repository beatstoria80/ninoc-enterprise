import React from 'react';
import { motion } from 'framer-motion';
import { Box, Printer } from 'lucide-react';
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
  const printBarcode = (sku: string, productName: string, size: string, color: string) => {
    if (!sku || sku === 'N/A') {
      alert('Please generate an SKU for this variant first.');
      return;
    }
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print SKU Barcode</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        <style>
          @page { size: 50mm 30mm; margin: 0; }
          body { margin: 0; padding: 5px; background: #fff; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 50mm; height: 30mm; box-sizing: border-box; }
          .title { font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
          .subtitle { font-size: 6px; font-weight: 500; text-transform: uppercase; margin-bottom: 2px; color: #444; }
          svg { width: 100%; max-height: 18mm; }
        </style>
      </head>
      <body>
        <div class="title">${productName}</div>
        <div class="subtitle">${size} | ${color}</div>
        <svg id="barcode"></svg>
        <script>
          window.onload = () => {
            JsBarcode("#barcode", "${sku}", {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 10,
              margin: 0
            });
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <motion.div
      key="inventory"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full pb-4 space-y-5"
    >
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-ink uppercase tracking-wide">Inventory Control</h2>
          <span className="text-[9px] text-ink/40">— stock & SKU directory</span>
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
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[8px] font-mono font-bold text-ink/60 bg-ink/5 px-1 py-0.5 rounded-sm border border-ink/10">{v.sku || v.id?.slice(0, 8) || 'N/A'}</p>
                            {v.sku && (
                              <button
                                onClick={() => printBarcode(v.sku!, p.name, v.size || 'OS', v.color || '-')}
                                className="text-[8px] flex items-center gap-1 text-ink/40 hover:text-rose transition-colors uppercase tracking-widest font-medium border border-transparent hover:border-rose/20 px-1 py-0.5 rounded-sm"
                                title="Print Barcode Label"
                              >
                                <Printer size={10} /> Print
                              </button>
                            )}
                          </div>
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
