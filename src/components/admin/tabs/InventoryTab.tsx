import React from 'react';
import { motion } from 'framer-motion';
import { Box, Printer, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const exportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Size', 'Color', 'Stock Quantity'];
    const rows: string[][] = [];
    products.forEach(p => {
      p.variants?.forEach(v => {
        rows.push([
          v.sku || '-', 
          `"${p.name.replace(/"/g, '""')}"`, 
          p.category, 
          v.size || '-', 
          v.color || '-', 
          (v.stock_quantity || 0).toString()
        ]);
      });
    });
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NINOC_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const currentDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let tableRows = '';
    products.forEach(p => {
      p.variants?.forEach(v => {
        const qty = v.stock_quantity || 0;
        const isLow = qty > 0 && qty < 5;
        const isOOS = qty === 0;
        const rowStyle = isOOS ? 'color: #ef4444; font-weight: 600;' : isLow ? 'color: #d97706; font-weight: 500;' : '';
        tableRows += `
          <tr style="${rowStyle}">
            <td style="font-family: monospace;">${v.sku || '-'}</td>
            <td>${p.name}</td>
            <td style="text-transform: uppercase;">${p.category}</td>
            <td>${v.size || '-'}</td>
            <td>${v.color || '-'}</td>
            <td style="text-align: right; font-weight: bold;">${qty}</td>
          </tr>
        `;
      });
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report - NINOC</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #111; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; }
          h1 { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
          .sub { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #666; margin-top: 4px; }
          .meta { font-size: 11px; text-align: right; }
          .meta-title { font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border-bottom: 1px solid #eaeaea; padding: 10px 12px; text-align: left; }
          th { background-color: #fafafa; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 9px; color: #666; border-bottom: 2px solid #111; }
          tr:nth-child(even) { background-color: #fdfdfd; }
          @media print {
            @page { margin: 1.5cm; size: A4 portrait; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Inventory Status Report</h1>
            <div class="sub">NINOC STUDIO WAREHOUSE</div>
          </div>
          <div class="meta">
            <div class="meta-title">Generated On</div>
            <div>${currentDate}</div>
            <div style="margin-top: 8px;" class="meta-title">Total Articles</div>
            <div>${products.length} Items</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>SKU / ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Size</th>
              <th>Color</th>
              <th style="text-align: right;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
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
          <span className="text-[9px] text-ink/40 hidden sm:inline-block">— stock & SKU directory</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-ink bg-white border border-ink/20 hover:border-ink hover:bg-ink/5 rounded transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white bg-ink hover:bg-ink/90 rounded transition-colors"
          >
            <FileText size={12} />
            Print Report
          </button>
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
          const allSkusVerified = p.variants && p.variants.length > 0 && p.variants.every(v => v.sku && v.sku.trim() !== '');

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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[9px] text-ink/40 uppercase tracking-widest">{p.category} • {p.variants?.length || 0} SKUs</p>
                      {allSkusVerified && (
                        <div className="flex items-center gap-1 text-[7px] font-medium uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-1 py-0.5 border border-emerald-100/50 rounded-sm">
                          <CheckCircle2 size={8} /> Verified
                        </div>
                      )}
                      {!allSkusVerified && p.variants && p.variants.length > 0 && (
                        <div className="flex items-center gap-1 text-[7px] font-medium uppercase tracking-[0.2em] text-rose bg-rose/5 px-1 py-0.5 border border-rose/10 rounded-sm">
                          <AlertCircle size={8} /> Missing SKU
                        </div>
                      )}
                    </div>
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
