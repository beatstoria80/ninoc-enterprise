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
          roas: v.discount > 0 ? (v.revenue / v.discount) : (v.revenue > 0 ? 9999 : 0)
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
          roas: a.commission > 0 ? (a.revenue / a.commission) : (a.revenue > 0 ? 9999 : 0),
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
        roas: totalMarketingCost > 0 ? (totalRev / totalMarketingCost) : (totalRev > 0 ? 9999 : 0),
        vouchers: {
          totalUsages: vUsages,
          totalDiscountGiven: vDiscount,
          totalRevenue: vRevenue,
          netProfit: (vRevenue - vCogs) - vDiscount,
          roas: vDiscount > 0 ? (vRevenue / vDiscount) : (vRevenue > 0 ? 9999 : 0)
        },
        affiliates: {
          totalClicks: aClicks,
          totalOrders: aOrdersCount,
          totalCommission: aCommission,
          totalRevenue: aRevenue,
          netProfit: (aRevenue - aCogs) - aCommission,
          roas: aCommission > 0 ? (aRevenue / aCommission) : (aRevenue > 0 ? 9999 : 0)
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
        supplier_cost: Number(editingCostings[id].supplier_cost !== undefined ? editingCostings[id].supplier_cost : costings.find(c => c.id === id).supplier_cost),
        packaging_cost: Number(editingCostings[id].packaging_cost !== undefined ? editingCostings[id].packaging_cost : costings.find(c => c.id === id).packaging_cost),
        operational_pct: Number(editingCostings[id].operational_pct !== undefined ? editingCostings[id].operational_pct : costings.find(c => c.id === id).operational_pct),
        target_margin_pct: Number(editingCostings[id].target_margin_pct !== undefined ? editingCostings[id].target_margin_pct : costings.find(c => c.id === id).target_margin_pct),
        target_roas: Number(editingCostings[id].target_roas !== undefined ? editingCostings[id].target_roas : costings.find(c => c.id === id).target_roas),
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
    <div className="space-y-8 w-full pb-20">
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight text-ink flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Marketing & Real ROAS
        </h1>
        <p className="text-xs md:text-[11px] text-ink/90 mt-1 uppercase tracking-widest">
          Analisis Margin Kotor, Laba Bersih, dan Return on Ad Spend berstandar e-Commerce.
        </p>
      </div>

      {/* OVERALL ROAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-ink text-white rounded-sm p-5 relative overflow-hidden">
          <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest mb-1">True Net Profit</p>
          <p className={cn("text-2xl font-mono tracking-tight", metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose")}>
            IDR {fIDR(metrics.netProfit)}
          </p>
          <p className="text-[9px] text-white/40 mt-2">Gross Profit - Marketing Spend</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5"><TrendingUp size={64} /></div>
          <p className="text-[9px] font-semibold text-ink/90 uppercase tracking-widest mb-1">Real ROAS</p>
          <p className="text-2xl font-mono tracking-tight text-ink">{metrics.roas.toFixed(1)}x</p>
          <div className="flex items-center gap-1 mt-2 text-[10px]">
            {metrics.netProfit >= 0 ? (
              <span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight size={12}/> Profitable</span>
            ) : (
              <span className="text-rose flex items-center gap-1"><ArrowDownRight size={12}/> Boncos</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5">
          <p className="text-[9px] font-semibold text-ink/90 uppercase tracking-widest mb-1">Total Marketing Spend</p>
          <p className="text-2xl font-mono tracking-tight text-rose">IDR {fIDR(metrics.marketingSpend)}</p>
          <p className="text-[9px] text-ink/80 mt-2">Diskon + Komisi</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5">
          <p className="text-[9px] font-semibold text-ink/90 uppercase tracking-widest mb-1">Gross Profit</p>
          <p className="text-2xl font-mono tracking-tight text-emerald-600">IDR {fIDR(metrics.grossProfit)}</p>
          <p className="text-[9px] text-ink/80 mt-2">Revenue - COGS</p>
        </div>
      </div>

      {/* TWO COLUMNS: VOUCHERS vs AFFILIATES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-4">
        
        {/* VOUCHER ANALYTICS */}
        <div className="space-y-2">
          <h2 className="text-xs md:text-[11px] font-semibold uppercase tracking-[0.1em] text-ink flex items-center gap-2 border-b border-ink/10 pb-2">
            <Ticket className="w-4 h-4 text-ink/80" /> Internal Vouchers
          </h2>
          
          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.015]">
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest">Code</th>
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest text-right">Net Profit</th>
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest text-right">Discount Cost</th>
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest text-right">Real ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {topVouchers.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[10px] text-ink/80">No voucher data yet</td></tr>
                ) : (
                  topVouchers.map((v, i) => (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-2 py-1.5">
                        <p className="text-[10px] font-semibold text-ink">{v.code}</p>
                        <p className="text-[9px] text-ink/80 uppercase tracking-wider">{v.usages} uses</p>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <p className={cn("text-[10px] font-mono", v.netProfit >= 0 ? "text-emerald-600" : "text-rose")}>
                          IDR {fIDR(v.netProfit)}
                        </p>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <p className="text-[10px] font-mono text-rose">IDR {fIDR(v.discount)}</p>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-[9px] font-mono font-medium",
                          v.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose/10 text-rose"
                        )}>
                          {v.roas.toFixed(1)}x
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
        <div className="space-y-2">
          <h2 className="text-xs md:text-[11px] font-semibold uppercase tracking-[0.1em] text-ink flex items-center gap-2 border-b border-ink/10 pb-2">
            <Users className="w-4 h-4 text-ink/80" /> Affiliate Program
          </h2>

          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.015]">
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest">Affiliate</th>
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest text-right">Net Profit</th>
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest text-right">Comm Cost</th>
                  <th className="px-2 py-1 text-[9px] font-medium text-ink/80 uppercase tracking-widest text-right">Real ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {topAffiliates.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[10px] text-ink/80">No affiliate data yet</td></tr>
                ) : (
                  topAffiliates.map((a, i) => (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-2 py-1.5">
                        <p className="text-[10px] font-semibold text-ink truncate max-w-[100px]" title={a.name}>{a.name}</p>
                        <p className="text-[10px] md:text-[7px] text-ink/90 uppercase tracking-wider mt-0.5">{a.clicks} clicks • {a.orders} orders</p>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <p className={cn("text-[10px] font-mono", a.netProfit >= 0 ? "text-emerald-600" : "text-rose")}>
                          IDR {fIDR(a.netProfit)}
                        </p>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <p className="text-[10px] font-mono text-rose">IDR {fIDR(a.commission)}</p>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-[9px] font-mono font-medium",
                          a.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose/10 text-rose"
                        )}>
                          {a.roas.toFixed(1)}x
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
          <h2 className="text-xs md:text-[11px] font-semibold uppercase tracking-[0.1em] text-ink flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-ink/80" /> Product Costing Configuration
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
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest sticky left-0 bg-white">Product</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest">Selling Price (IDR)</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest">HPP Pabrik (IDR)</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest">Packaging (IDR)</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest">Operational (%)</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest">Target Margin (%)</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest border-r border-ink/10">Target ROAS (x)</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest bg-ink/[0.02]">Total COGS</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest bg-ink/[0.02]">Max CPA (Ad Spend)</th>
                <th className="px-2 py-1.5 text-[9px] font-medium text-ink/80 uppercase tracking-widest bg-ink/[0.02]">Est. Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {costings.map((p) => {
                const isEditing = !!editingCostings[p.id];
                const currentData = isEditing ? { ...p, ...editingCostings[p.id] } : p;
                
                const sp = Number(p.price) || 0;
                const hpp = Number(currentData.supplier_cost) || 0;
                const pkg = Number(currentData.packaging_cost) || 0;
                const opsPct = Number(currentData.operational_pct) || 0;
                const marginPct = Number(currentData.target_margin_pct) || 40;
                const roasPct = Number(currentData.target_roas) || 3;

                const opsCost = (opsPct / 100) * sp;
                const totalCogs = hpp + pkg + opsCost;
                const maxCpa = roasPct > 0 ? sp / roasPct : 0;
                const estNetProfit = sp - totalCogs - maxCpa;
                const targetNetProfit = (marginPct / 100) * sp;
                const isUnderTarget = estNetProfit < targetNetProfit;
                
                return (
                  <tr key={p.id} className="hover:bg-ink/[0.01] transition-colors">
                    <td className="px-2 py-1.5 sticky left-0 bg-white group-hover:bg-ink/[0.01]">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] font-semibold text-ink truncate max-w-[200px]" title={p.name}>{p.name}</p>
                        <p className="text-[8px] font-mono text-ink/50 uppercase tracking-widest">{p.variants?.[0]?.sku || 'NO-SKU'}</p>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <p className="text-[10px] font-mono text-ink">IDR {fIDR(p.price)}</p>
                    </td>
                    <td className="px-2 py-1">
                      <input 
                        type="number"
                        min="0"
                        className="w-28 text-[10px] font-mono px-2 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.supplier_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'supplier_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input 
                        type="number"
                        min="0"
                        className="w-24 text-[10px] font-mono px-2 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.packaging_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'packaging_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <div className="relative w-20">
                        <input 
                          type="number"
                          min="0"
                          className="w-full text-[10px] font-mono pl-2 pr-6 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                          value={currentData.operational_pct ?? ''}
                          onChange={(e) => handleCostingChange(p.id, 'operational_pct', e.target.value)}
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-ink/50">%</span>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="relative w-20">
                        <input 
                          type="number"
                          min="0"
                          className="w-full text-[10px] font-mono pl-2 pr-6 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                          value={currentData.target_margin_pct ?? ''}
                          onChange={(e) => handleCostingChange(p.id, 'target_margin_pct', e.target.value)}
                          placeholder="40"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-ink/50">%</span>
                      </div>
                    </td>
                    <td className="px-2 py-1 border-r border-ink/10">
                      <div className="relative w-20">
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          className="w-full text-[10px] font-mono pl-2 pr-6 py-1.5 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                          value={currentData.target_roas ?? ''}
                          onChange={(e) => handleCostingChange(p.id, 'target_roas', e.target.value)}
                          placeholder="3"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-ink/50 font-bold">x</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 bg-ink/[0.01]">
                      <p className="text-[10px] font-mono text-ink">IDR {fIDR(totalCogs)}</p>
                    </td>
                    <td className="px-2 py-1.5 bg-ink/[0.01]">
                      <p className="text-[10px] font-mono text-rose">IDR {fIDR(maxCpa)}</p>
                      <p className="text-[8px] text-ink/50 mt-0.5">Maks biaya Iklan/Affiliate</p>
                    </td>
                    <td className="px-2 py-1.5 bg-ink/[0.01]">
                      <div className="flex flex-col gap-0.5">
                        <p className={cn("text-[10px] font-mono font-bold", estNetProfit >= 0 ? (isUnderTarget ? "text-amber-500" : "text-emerald-600") : "text-rose")}>
                          IDR {fIDR(estNetProfit)}
                        </p>
                        <p className="text-[8px] text-ink/50">
                          Target Margin: <span className="text-ink/80 font-mono">IDR {fIDR(targetNetProfit)}</span>
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-ink/80 mt-3 italic">
          * Mengubah parameter HPP akan langsung mengubah kalkulasi Real ROAS dan Profit pada seluruh riwayat penjualan.
        </p>
      </div>

    </div>
  );
}
