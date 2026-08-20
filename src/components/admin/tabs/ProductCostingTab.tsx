"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageOpen, Save, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductCostingTab() {
  const [loading, setLoading] = useState(true);
  const [savingCosting, setSavingCosting] = useState(false);
  const [costings, setCostings] = useState<any[]>([]);
  const [editingCostings, setEditingCostings] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // Fetch Products & Costings natively
      const { data: productsData } = await supabase.from('products').select('id, name, price, variants(sku)');
      const { data: costingsData } = await supabase.from('product_costings').select('*');
      
      const mergedCostings = productsData?.map(p => {
        const c = costingsData?.find((cc: any) => cc.product_id === p.id) || {};
        const safeRoas = c.target_roas ? (c.target_roas > 50 ? c.target_roas / 100 : c.target_roas) : 3;
        
        return { 
          supplier_cost: 0, packaging_cost: 0, operational_pct: 0, target_margin_pct: 40,
          ...c, 
          ...p,
          target_roas: safeRoas
        };
      }) || [];
      
      setCostings(mergedCostings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCostingChange = (id: string, field: string, value: string) => {
    setEditingCostings(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveCostings = async () => {
    setSavingCosting(true);
    try {
      const updates = Object.keys(editingCostings).map(id => ({
        product_id: id,
        supplier_cost: Number(editingCostings[id].supplier_cost !== undefined ? editingCostings[id].supplier_cost : costings.find(c => c.id === id).supplier_cost),
        supplier_surcharge_cost: Number(editingCostings[id].supplier_surcharge_cost !== undefined ? editingCostings[id].supplier_surcharge_cost : costings.find(c => c.id === id).supplier_surcharge_cost || 0),
        packaging_cost: Number(editingCostings[id].packaging_cost !== undefined ? editingCostings[id].packaging_cost : costings.find(c => c.id === id).packaging_cost),
        operational_pct: Number(editingCostings[id].operational_pct !== undefined ? editingCostings[id].operational_pct : costings.find(c => c.id === id).operational_pct),
        midtrans_fee: Number(editingCostings[id].midtrans_fee !== undefined ? editingCostings[id].midtrans_fee : costings.find(c => c.id === id).midtrans_fee || 0),
        biteship_fee: Number(editingCostings[id].biteship_fee !== undefined ? editingCostings[id].biteship_fee : costings.find(c => c.id === id).biteship_fee || 0),
        target_margin_pct: Number(editingCostings[id].target_margin_pct !== undefined ? editingCostings[id].target_margin_pct : costings.find(c => c.id === id).target_margin_pct),
        target_roas: Number(editingCostings[id].target_roas !== undefined ? editingCostings[id].target_roas : costings.find(c => c.id === id).target_roas),
        return_cost: Number(editingCostings[id].return_cost !== undefined ? editingCostings[id].return_cost : costings.find(c => c.id === id).return_cost),
      }));

      const res = await fetch('/api/admin/costings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save costings');
      }

      setEditingCostings({});
      await loadData();
      alert("Costing data saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan data: " + (err.message || "Terjadi kesalahan server"));
    } finally {
      setSavingCosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <Calculator className="w-8 h-8 animate-pulse text-ink mb-4" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-ink">Memuat Data Costing...</p>
      </div>
    );
  }

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-4 w-full pb-20">
      <div className="bg-white border border-ink/10 rounded-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-ink/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ink/5 flex items-center justify-center text-ink shrink-0">
              <PackageOpen size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink">PRODUCT COSTING CONFIGURATION</h2>
              <p className="text-[10px] text-ink/60 tracking-wider">Konfigurasi HPP, Operasional, dan Target Profit Margin untuk setiap produk.</p>
            </div>
          </div>
          
          <button
            onClick={saveCostings}
            disabled={savingCosting || Object.keys(editingCostings).length === 0}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-ink text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {savingCosting ? (
              <span className="animate-pulse">Menyimpan...</span>
            ) : (
              <>
                <Save size={14} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Container with sticky first column & sticky header */}
        <div className="overflow-auto max-h-[75vh] border-b border-ink/5">
          <table className="w-full min-w-[1200px] text-left">
            <thead className="bg-[#F4F4F5] border-b border-ink/10 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <tr>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/5 sticky left-0 top-0 bg-[#EAEAEC] z-30 min-w-[250px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Product</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/5 min-w-[120px] bg-[#F4F4F5]">Selling Price (IDR)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/5 min-w-[140px] bg-[#F4F4F5]">HPP Pabrik (IDR)</th>
                <th className="px-3 py-3 text-xs font-medium text-indigo-700 uppercase tracking-wide border-r border-ink/5 min-w-[160px] bg-[#EEF2FF]">HPP Surcharge (XXL - 5XL)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/5 min-w-[120px] bg-[#F4F4F5]">Packaging (IDR)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/5 min-w-[120px] bg-[#FFF1F2]">Biaya Retur (IDR)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/5 min-w-[130px] bg-[#F4F4F5]">Operational (IDR)</th>
                <th className="px-3 py-3 text-xs font-medium text-blue-600 uppercase tracking-wide border-r border-ink/5 min-w-[130px] bg-[#EFF6FF]">Midtrans Fee (IDR)</th>
                <th className="px-3 py-3 text-xs font-medium text-blue-600 uppercase tracking-wide border-r border-ink/5 min-w-[130px] bg-[#EFF6FF]">Biteship Fee (IDR)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/5 min-w-[130px] bg-[#F4F4F5]">Target Margin (%)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/10 min-w-[130px] bg-[#F4F4F5]">Target ROAS (x)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide bg-[#EAEAEC] border-r border-ink/5 min-w-[120px]">Total COGS</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide bg-[#EAEAEC] border-r border-ink/5 min-w-[140px]">Max CPA (Ad Spend)</th>
                <th className="px-3 py-3 text-xs font-medium text-ink/80 uppercase tracking-wide bg-[#EAEAEC] min-w-[140px]">Est. Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {costings.map((p) => {
                const isEditing = !!editingCostings[p.id];
                const currentData = isEditing ? { ...p, ...editingCostings[p.id] } : p;
                
                const sp = Number(p.price) || 0;
                const hpp = Number(currentData.supplier_cost) || 0;
                const pkg = Number(currentData.packaging_cost) || 0;
                const ret = Number(currentData.return_cost) || 0;
                const opsPct = Number(currentData.operational_pct) || 0; 
                const midtransFee = Number(currentData.midtrans_fee) || 0;
                const biteshipFee = Number(currentData.biteship_fee) || 0;
                const marginPct = Number(currentData.target_margin_pct) || 40;
                const roasPct = Number(currentData.target_roas) || 3;

                const opsCost = opsPct; 
                const totalCogs = hpp + pkg + opsCost + midtransFee + biteshipFee; 
                const maxCpa = roasPct > 0 ? sp / roasPct : 0;
                const estNetProfit = sp - totalCogs - maxCpa;
                const targetNetProfit = (marginPct / 100) * sp;
                const isUnderTarget = estNetProfit < targetNetProfit;
                
                return (
                  <tr key={p.id} className="hover:bg-ink/[0.01] transition-colors group">
                    <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-[#FCFCFC] border-r border-ink/5 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-ink line-clamp-2" title={p.name}>{p.name}</p>
                        <p className="text-[10px] font-mono text-ink/60 uppercase">{p.variants?.[0]?.sku || 'NO-SKU'}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5">
                      <p className="text-xs font-mono text-ink">IDR {fIDR(sp)}</p>
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5">
                      <input 
                        type="number"
                        min="0"
                        className="w-full text-xs font-mono px-2 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.supplier_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'supplier_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5 bg-indigo-50/20">
                      <input 
                        type="number"
                        min="0"
                        className="w-full text-xs font-mono px-2 py-1.5 border border-indigo-200 rounded-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all bg-white text-indigo-700 font-semibold"
                        value={currentData.supplier_surcharge_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'supplier_surcharge_cost', e.target.value)}
                        placeholder="0"
                        title="Extra cost for XXL+ sizes"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5">
                      <input 
                        type="number"
                        min="0"
                        className="w-full text-xs font-mono px-2 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.packaging_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'packaging_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5 bg-rose/5">
                      <input 
                        type="number"
                        min="0"
                        className="w-full text-xs font-mono px-2 py-1.5 border border-rose/20 rounded-sm focus:outline-none focus:border-rose/50 focus:ring-1 focus:ring-rose/20 transition-all bg-white text-rose"
                        value={currentData.return_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'return_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5">
                      <input 
                        type="number"
                        min="0"
                        className="w-full text-xs font-mono px-2 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.operational_pct ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'operational_pct', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5 bg-blue-50/20">
                      <input 
                        type="number"
                        min="0"
                        className="w-full text-xs font-mono px-2 py-1.5 border border-blue-200 rounded-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all bg-white text-blue-700 font-semibold"
                        value={currentData.midtrans_fee ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'midtrans_fee', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5 bg-blue-50/20">
                      <input 
                        type="number"
                        min="0"
                        className="w-full text-xs font-mono px-2 py-1.5 border border-blue-200 rounded-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all bg-white text-blue-700 font-semibold"
                        value={currentData.biteship_fee ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'biteship_fee', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-ink/5">
                      <div className="relative w-full">
                        <input 
                          type="number"
                          min="0"
                          className="w-full text-xs font-mono pl-2 pr-6 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                          value={currentData.target_margin_pct ?? ''}
                          onChange={(e) => handleCostingChange(p.id, 'target_margin_pct', e.target.value)}
                          placeholder="40"
                        />
                        <span className="absolute right-2 top-2 text-xs text-ink/50">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-r border-ink/10">
                      <div className="relative w-full">
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          className="w-full text-xs font-mono pl-2 pr-6 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                          value={currentData.target_roas ?? ''}
                          onChange={(e) => handleCostingChange(p.id, 'target_roas', e.target.value)}
                          placeholder="3"
                        />
                        <span className="absolute right-2 top-2 text-xs text-ink/50 font-bold">x</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 bg-ink/[0.01] border-r border-ink/5">
                      <p className="text-xs font-mono text-ink font-semibold">IDR {fIDR(totalCogs)}</p>
                    </td>
                    <td className="px-3 py-2 bg-ink/[0.01] border-r border-ink/5">
                      <p className="text-xs font-mono text-rose font-semibold">IDR {fIDR(maxCpa)}</p>
                      <p className="text-[9px] text-ink/60 mt-0.5 leading-tight">Maks Ad Spend</p>
                    </td>
                    <td className="px-3 py-2 bg-ink/[0.01]">
                      <div className="flex flex-col gap-0.5">
                        <p className={cn("text-xs font-mono font-bold", estNetProfit >= 0 ? (isUnderTarget ? "text-amber-500" : "text-emerald-600") : "text-rose")}>
                          IDR {fIDR(estNetProfit)}
                        </p>
                        <p className="text-[9px] text-ink/60 leading-tight">
                          Target: <span className="text-ink/80 font-mono">IDR {fIDR(targetNetProfit)}</span>
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-xs text-ink/80 mt-2 italic bg-amber-50 p-3 rounded border border-amber-100 flex items-start gap-2">
        <span className="text-amber-600 font-bold mt-0.5">ℹ</span>
        <span>
          Mengubah HPP akan langsung memperbarui kalkulasi Real ROAS dan Profit pada seluruh riwayat penjualan secara otomatis.<br/>
          Surcharge akan otomatis ditambahkan ke HPP dasar ketika pembeli memilih ukuran XXL, 3XL, 4XL, hingga 5XL.
        </span>
      </p>
    </div>
  );
}
