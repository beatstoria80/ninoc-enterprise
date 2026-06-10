"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Ticket, Shield, Users, ArrowUpRight, ArrowDownRight, PackageOpen, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketingTab() {
  const [loading, setLoading] = useState(true);
  const [savingCosting, setSavingCosting] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCOGS: 0,
    grossProfit: 0,
    marketingSpend: 0,
    netProfit: 0,
    roas: 0,
    vouchers: {
      totalUsages: 0,
      totalDiscountGiven: 0,
      totalRevenue: 0,
      netProfit: 0,
      roas: 0
    },
    affiliates: {
      totalClicks: 0,
      totalOrders: 0,
      totalCommission: 0,
      totalRevenue: 0,
      netProfit: 0,
      roas: 0
    }
  });

  const [topVouchers, setTopVouchers] = useState<any[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<any[]>([]);
  
  // Costing State
  const [costings, setCostings] = useState<any[]>([]);
  const [editingCostings, setEditingCostings] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // 1. Fetch Products & Costings
      const { data: productsData } = await supabase.from('products').select('id, name, price');
      const { data: costingsData } = await supabase.from('product_costings').select('*');
      
      const mergedCostings = productsData?.map(p => {
        const c = costingsData?.find((cc: any) => cc.product_id === p.id) || {
          supplier_cost: 0, packaging_cost: 0, operational_pct: 0, target_margin_pct: 40, target_roas: 300
        };
        return { ...p, ...c };
      }) || [];
      
      setCostings(mergedCostings);
      
      // Map for fast HPP lookup
      const costMap: Record<string, number> = {};
      mergedCostings.forEach(c => {
        const baseCost = Number(c.supplier_cost) + Number(c.packaging_cost);
        const opCost = (Number(c.operational_pct) / 100) * Number(c.price);
        costMap[c.id] = baseCost + opCost; // COGS per unit
      });

      // 2. Fetch Marketing Data
      const { data: voucherUsages } = await supabase.from('voucher_usages').select('*, vouchers(code), orders(id, total_price)');
      const { data: affiliates } = await supabase.from('affiliates').select('*');
      const { data: affiliateClicks } = await supabase.from('affiliate_clicks').select('*');
      const { data: affiliateOrders } = await supabase.from('orders').select('id, total_price, affiliate_code').not('affiliate_code', 'is', null);
      
      // Fetch Order Items for accurate COGS
      const orderIds = [
        ...(voucherUsages?.map(vu => vu.order_id) || []),
        ...(affiliateOrders?.map(ao => ao.id) || [])
      ].filter(Boolean);

      let orderItems: any[] = [];
      if (orderIds.length > 0) {
        const { data: items } = await supabase.from('order_items').select('order_id, product_id, quantity, price_at_purchase').in('order_id', orderIds);
        orderItems = items || [];
      }

      // Calculate Order COGS
      const orderCogsMap: Record<string, number> = {};
      orderItems.forEach(item => {
        const unitCogs = costMap[item.product_id] || 0;
        if (!orderCogsMap[item.order_id]) orderCogsMap[item.order_id] = 0;
        orderCogsMap[item.order_id] += (unitCogs * item.quantity);
      });

      // Process Vouchers
      let vUsages = 0, vDiscount = 0, vRevenue = 0, vCogs = 0;
      const vMap: any = {};

      if (voucherUsages) {
        vUsages = voucherUsages.length;
        voucherUsages.forEach(vu => {
          vDiscount += vu.discount_applied || 0;
          const rev = vu.orders?.total_price || 0;
          const cogs = orderCogsMap[vu.order_id] || 0;
          
          vRevenue += rev;
          vCogs += cogs;
          
          const code = vu.vouchers?.code || 'UNKNOWN';
          if (!vMap[code]) vMap[code] = { code, usages: 0, discount: 0, revenue: 0, cogs: 0 };
          vMap[code].usages++;
          vMap[code].discount += vu.discount_applied || 0;
          vMap[code].revenue += rev;
          vMap[code].cogs += cogs;
        });
      }
      
      const vTop = Object.values(vMap).map((v: any) => {
        const grossProfit = v.revenue - v.cogs;
        const netProfit = grossProfit - v.discount;
        return {
          ...v,
          grossProfit,
          netProfit,
          roas: v.discount > 0 ? (grossProfit / v.discount) * 100 : (grossProfit > 0 ? 9999 : 0)
        };
      }).sort((a, b) => b.netProfit - a.netProfit).slice(0, 5);

      // Process Affiliates
      let aClicks = affiliateClicks?.length || 0;
      let aOrdersCount = affiliateOrders?.length || 0;
      let aRevenue = 0, aCogs = 0, aCommission = 0;
      const aMap: any = {};
      
      if (affiliates) {
        affiliates.forEach(af => {
          aCommission += af.total_earnings || 0; // rough approximation for now, real system links comm to order
          aMap[af.code] = { name: af.name || 'Unknown', code: af.code, clicks: 0, orders: 0, revenue: 0, cogs: 0, commission: af.total_earnings || 0 };
        });
      }

      if (affiliateClicks) {
        affiliateClicks.forEach(ac => {
          if (aMap[ac.affiliate_code]) aMap[ac.affiliate_code].clicks++;
        });
      }

      if (affiliateOrders) {
        affiliateOrders.forEach(ao => {
          const rev = ao.total_price || 0;
          const cogs = orderCogsMap[ao.id] || 0;
          aRevenue += rev;
          aCogs += cogs;
          if (aMap[ao.affiliate_code]) {
            aMap[ao.affiliate_code].orders++;
            aMap[ao.affiliate_code].revenue += rev;
            aMap[ao.affiliate_code].cogs += cogs;
          }
        });
      }
      
      const aTop = Object.values(aMap).filter((a: any) => a.orders > 0 || a.clicks > 0).map((a: any) => {
        const grossProfit = a.revenue - a.cogs;
        const netProfit = grossProfit - a.commission;
        return {
          ...a,
          grossProfit,
          netProfit,
          roas: a.commission > 0 ? (grossProfit / a.commission) * 100 : (grossProfit > 0 ? 9999 : 0),
          cvr: a.clicks > 0 ? (a.orders / a.clicks) * 100 : 0
        };
      }).sort((a, b) => b.netProfit - a.netProfit).slice(0, 5);

      const totalRev = vRevenue + aRevenue;
      const totalCogs = vCogs + aCogs;
      const totalGrossProfit = totalRev - totalCogs;
      const totalMarketingCost = vDiscount + aCommission;
      const totalNetProfit = totalGrossProfit - totalMarketingCost;

      setMetrics({
        totalRevenue: totalRev,
        totalCOGS: totalCogs,
        grossProfit: totalGrossProfit,
        marketingSpend: totalMarketingCost,
        netProfit: totalNetProfit,
        roas: totalMarketingCost > 0 ? (totalGrossProfit / totalMarketingCost) * 100 : (totalGrossProfit > 0 ? 9999 : 0),
        vouchers: {
          totalUsages: vUsages,
          totalDiscountGiven: vDiscount,
          totalRevenue: vRevenue,
          netProfit: (vRevenue - vCogs) - vDiscount,
          roas: vDiscount > 0 ? ((vRevenue - vCogs) / vDiscount) * 100 : (vRevenue - vCogs > 0 ? 9999 : 0)
        },
        affiliates: {
          totalClicks: aClicks,
          totalOrders: aOrdersCount,
          totalCommission: aCommission,
          totalRevenue: aRevenue,
          netProfit: (aRevenue - aCogs) - aCommission,
          roas: aCommission > 0 ? ((aRevenue - aCogs) / aCommission) * 100 : (aRevenue - aCogs > 0 ? 9999 : 0)
        }
      });

      setTopVouchers(vTop);
      setTopAffiliates(aTop);
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
        supplier_cost: Number(editingCostings[id].supplier_cost || costings.find(c => c.id === id).supplier_cost),
        packaging_cost: Number(editingCostings[id].packaging_cost || costings.find(c => c.id === id).packaging_cost),
        operational_pct: Number(editingCostings[id].operational_pct || costings.find(c => c.id === id).operational_pct),
        target_margin_pct: Number(editingCostings[id].target_margin_pct || costings.find(c => c.id === id).target_margin_pct),
        target_roas: Number(editingCostings[id].target_roas || costings.find(c => c.id === id).target_roas),
      }));

      for (const update of updates) {
        await supabase.from('product_costings').upsert(update, { onConflict: 'product_id' });
      }
      setEditingCostings({});
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <TrendingUp className="w-8 h-8 animate-pulse text-ink mb-4" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-ink">Menghitung Data ROAS & HPP...</p>
      </div>
    );
  }

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight text-ink flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Marketing & Real ROAS
        </h1>
        <p className="text-[11px] text-ink/50 mt-1 uppercase tracking-widest">
          Analisis Margin Kotor, Laba Bersih, dan Return on Ad Spend berstandar e-Commerce.
        </p>
      </div>

      {/* OVERALL ROAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-ink text-white rounded-sm p-5 relative overflow-hidden">
          <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest mb-1">True Net Profit</p>
          <p className={cn("text-2xl font-mono tracking-tight", metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose")}>
            IDR {fIDR(metrics.netProfit)}
          </p>
          <p className="text-[9px] text-white/40 mt-2">Gross Profit - Marketing Spend</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={64} /></div>
          <p className="text-[9px] font-semibold text-ink/50 uppercase tracking-widest mb-1">Real ROAS</p>
          <p className="text-2xl font-mono tracking-tight text-ink">{metrics.roas.toFixed(1)}%</p>
          <div className="flex items-center gap-1 mt-2 text-[10px]">
            {metrics.roas >= 100 ? (
              <span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight size={12}/> Profitable</span>
            ) : (
              <span className="text-rose flex items-center gap-1"><ArrowDownRight size={12}/> Boncos</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5">
          <p className="text-[9px] font-semibold text-ink/50 uppercase tracking-widest mb-1">Total Marketing Spend</p>
          <p className="text-2xl font-mono tracking-tight text-rose">IDR {fIDR(metrics.marketingSpend)}</p>
          <p className="text-[9px] text-ink/40 mt-2">Diskon + Komisi</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5">
          <p className="text-[9px] font-semibold text-ink/50 uppercase tracking-widest mb-1">Gross Profit</p>
          <p className="text-2xl font-mono tracking-tight text-emerald-600">IDR {fIDR(metrics.grossProfit)}</p>
          <p className="text-[9px] text-ink/40 mt-2">Revenue - COGS</p>
        </div>
      </div>

      {/* TWO COLUMNS: VOUCHERS vs AFFILIATES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* VOUCHER ANALYTICS */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink flex items-center gap-2 border-b border-ink/10 pb-2">
            <Ticket className="w-4 h-4 text-ink/40" /> Internal Vouchers
          </h2>
          
          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.015]">
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Code</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Net Profit</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Discount Cost</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Real ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {topVouchers.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[10px] text-ink/40">No voucher data yet</td></tr>
                ) : (
                  topVouchers.map((v, i) => (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[10px] font-semibold text-ink">{v.code}</p>
                        <p className="text-[8px] text-ink/40 uppercase tracking-wider">{v.usages} uses</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className={cn("text-[10px] font-mono", v.netProfit >= 0 ? "text-emerald-600" : "text-rose")}>
                          IDR {fIDR(v.netProfit)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-[10px] font-mono text-rose">IDR {fIDR(v.discount)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-[9px] font-mono font-medium",
                          v.roas >= 100 ? "bg-emerald-50 text-emerald-700" : "bg-rose/10 text-rose"
                        )}>
                          {v.roas.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AFFILIATE ANALYTICS */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink flex items-center gap-2 border-b border-ink/10 pb-2">
            <Users className="w-4 h-4 text-ink/40" /> Affiliate Program
          </h2>

          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.015]">
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Affiliate</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Net Profit</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Comm Cost</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Real ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {topAffiliates.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[10px] text-ink/40">No affiliate data yet</td></tr>
                ) : (
                  topAffiliates.map((a, i) => (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[10px] font-semibold text-ink truncate max-w-[100px]" title={a.name}>{a.name}</p>
                        <p className="text-[7px] text-ink/30 uppercase tracking-wider mt-0.5">{a.clicks} clicks • {a.orders} orders</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className={cn("text-[10px] font-mono", a.netProfit >= 0 ? "text-emerald-600" : "text-rose")}>
                          IDR {fIDR(a.netProfit)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-[10px] font-mono text-rose">IDR {fIDR(a.commission)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-[9px] font-mono font-medium",
                          a.roas >= 100 ? "bg-emerald-50 text-emerald-700" : "bg-rose/10 text-rose"
                        )}>
                          {a.roas.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COSTING CONFIGURATION GRID */}
      <div className="pt-10">
        <div className="flex items-center justify-between mb-4 border-b border-ink/10 pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-ink/40" /> Product Costing Configuration
          </h2>
          {Object.keys(editingCostings).length > 0 && (
            <button 
              onClick={saveCostings}
              disabled={savingCosting}
              className="px-4 py-1.5 bg-ink text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose transition-colors flex items-center gap-2"
            >
              {savingCosting ? 'Saving...' : <><Save size={12}/> Save Changes</>}
            </button>
          )}
        </div>

        <div className="bg-white border border-ink/10 rounded-sm overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-ink/5 bg-ink/[0.015]">
                <th className="px-4 py-3 text-[8px] font-medium text-ink/40 uppercase tracking-widest sticky left-0 bg-white">Product</th>
                <th className="px-4 py-3 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Selling Price (IDR)</th>
                <th className="px-4 py-3 text-[8px] font-medium text-ink/40 uppercase tracking-widest">HPP Pabrik (IDR)</th>
                <th className="px-4 py-3 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Packaging (IDR)</th>
                <th className="px-4 py-3 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Operational (%)</th>
                <th className="px-4 py-3 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Target Margin (%)</th>
                <th className="px-4 py-3 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Target ROAS (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {costings.map((p) => {
                const isEditing = !!editingCostings[p.id];
                const currentData = isEditing ? { ...p, ...editingCostings[p.id] } : p;
                
                return (
                  <tr key={p.id} className="hover:bg-ink/[0.01] transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-ink/[0.01]">
                      <p className="text-[10px] font-semibold text-ink truncate max-w-[200px]" title={p.name}>{p.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono text-ink">IDR {fIDR(p.price)}</p>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number"
                        className="w-24 text-[10px] font-mono px-2 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/30"
                        value={currentData.supplier_cost}
                        onChange={(e) => handleCostingChange(p.id, 'supplier_cost', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number"
                        className="w-20 text-[10px] font-mono px-2 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/30"
                        value={currentData.packaging_cost}
                        onChange={(e) => handleCostingChange(p.id, 'packaging_cost', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative w-16">
                        <input 
                          type="number"
                          className="w-full text-[10px] font-mono pl-2 pr-6 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/30"
                          value={currentData.operational_pct}
                          onChange={(e) => handleCostingChange(p.id, 'operational_pct', e.target.value)}
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-ink/40">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative w-16">
                        <input 
                          type="number"
                          className="w-full text-[10px] font-mono pl-2 pr-6 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/30"
                          value={currentData.target_margin_pct}
                          onChange={(e) => handleCostingChange(p.id, 'target_margin_pct', e.target.value)}
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-ink/40">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative w-20">
                        <input 
                          type="number"
                          className="w-full text-[10px] font-mono pl-2 pr-6 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/30"
                          value={currentData.target_roas}
                          onChange={(e) => handleCostingChange(p.id, 'target_roas', e.target.value)}
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-ink/40">%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-ink/40 mt-3 italic">
          * Mengubah parameter HPP akan langsung mengubah kalkulasi Real ROAS dan Profit pada seluruh riwayat penjualan.
        </p>
      </div>

    </div>
  );
}
