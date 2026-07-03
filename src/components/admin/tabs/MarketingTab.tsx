"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Ticket, Shield, Users, ArrowUpRight, ArrowDownRight, PackageOpen, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoogleAdsData, type GoogleAdsData } from '@/actions/googleAds';

export function MarketingTab() {
  const [loading, setLoading] = useState(true);
  const [savingCosting, setSavingCosting] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCOGS: 0,
    grossProfit: 0,
    marketingSpend: 0,
    inventoryValue: 0,
    googleAds: { totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, campaigns: [] } as GoogleAdsData,
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
      const { data: productsData } = await supabase.from('products').select('id, name, price, variants(sku, stock_quantity)');
      const { data: costingsData } = await supabase.from('product_costings').select('*');
      
      let totalInventoryValue = 0;

      const mergedCostings = productsData?.map(p => {
        const c = costingsData?.find((cc: any) => cc.product_id === p.id) || {};
        const safeRoas = c.target_roas ? (c.target_roas > 50 ? c.target_roas / 100 : c.target_roas) : 3;
        
        // Calculate inventory value for this product
        let productStock = 0;
        if (p.variants) {
          p.variants.forEach((v: any) => {
            productStock += v.stock_quantity || 0;
          });
        }
        
        const baseCost = Number(c.supplier_cost) || 0;
        const pkgCost = Number(c.packaging_cost) || 0;
        const opCost = Number(c.operational_pct) || 0; // treating as IDR
        const unitCogs = baseCost + pkgCost + opCost;
        
        totalInventoryValue += (productStock * unitCogs);

        return { 
          supplier_cost: 0, packaging_cost: 0, operational_pct: 0, target_margin_pct: 40,
          ...c, 
          ...p,
          target_roas: safeRoas,
          total_stock: productStock
        };
      }) || [];
      
      setCostings(mergedCostings);
      
      // Map for fast HPP lookup
      const costMap: Record<string, number> = {};
      mergedCostings.forEach(c => {
        const baseCost = Number(c.supplier_cost) + Number(c.packaging_cost);
        const opCost = Number(c.operational_pct) || 0; // Fixed: Treat as flat IDR instead of percentage
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
      
      // Fetch Google Ads Data via Server Action
      const googleAds = await getGoogleAdsData();
      
      // Total marketing cost now includes Google Ads spend!
      const totalMarketingCost = vDiscount + aCommission + googleAds.totalSpend;
      const totalNetProfit = totalGrossProfit - totalMarketingCost;

      setMetrics({
        totalRevenue: totalRev,
        totalCOGS: totalCogs,
        grossProfit: totalGrossProfit,
        marketingSpend: totalMarketingCost,
        inventoryValue: totalInventoryValue,
        googleAds: googleAds,
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
        <TrendingUp className="w-8 h-8 animate-pulse text-ink mb-4" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-ink">Menghitung Data ROAS & HPP...</p>
      </div>
    );
  }

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-3 w-full pb-20">
      <div className="mb-4">
        <h1 className="text-xl font-medium tracking-tight text-ink flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Marketing & Real ROAS
        </h1>
        <p className="text-xs md:text-sm text-ink/90 mt-1">
          Analisis Keuntungan Bersih dan Efisiensi Iklan (ROAS) untuk seluruh produk.
        </p>
      </div>

      {/* OVERALL ROAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-ink text-white rounded-md p-3 relative overflow-hidden flex flex-col justify-between">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">True Net Profit</p>
          <p className={cn("text-2xl font-mono tracking-tight", metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose")}>
            IDR {fIDR(metrics.netProfit)}
          </p>
          <p className="text-[11px] text-white/60 mt-1">Keuntungan Bersih (Laba Kotor - Biaya Marketing)</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-md p-3 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-2 opacity-5"><TrendingUp size={48} /></div>
          <p className="text-xs font-semibold text-ink/90 uppercase tracking-wide mb-1">Real ROAS</p>
          <p className="text-2xl font-mono tracking-tight text-ink">{metrics.roas.toFixed(1)}x</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-ink/60">Pendapatan ÷ Biaya Marketing</p>
            {metrics.netProfit >= 0 ? (
              <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium"><ArrowUpRight size={12}/> Profitable</span>
            ) : (
              <span className="text-[11px] text-rose flex items-center gap-1 font-medium"><ArrowDownRight size={12}/> Boncos</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-md p-3 flex flex-col justify-between">
          <p className="text-xs font-semibold text-ink/90 uppercase tracking-wide mb-1">Total Marketing Spend</p>
          <p className="text-2xl font-mono tracking-tight text-rose">IDR {fIDR(metrics.marketingSpend)}</p>
          <div className="text-[11px] text-ink/70 mt-2 space-y-1">
            <p className="flex justify-between border-b border-ink/5 pb-0.5"><span>Internal Vouchers:</span> <span>IDR {fIDR(metrics.vouchers.totalDiscountGiven)}</span></p>
            <p className="flex justify-between border-b border-ink/5 pb-0.5"><span>Affiliate Comm:</span> <span>IDR {fIDR(metrics.affiliates.totalCommission)}</span></p>
            <p className="flex justify-between font-semibold text-rose/90"><span>Google Ads Spend:</span> <span>IDR {fIDR(metrics.googleAds.totalSpend)}</span></p>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-md p-3 flex flex-col justify-between">
          <p className="text-xs font-semibold text-ink/90 uppercase tracking-wide mb-1">Gross Profit</p>
          <p className="text-2xl font-mono tracking-tight text-emerald-600">IDR {fIDR(metrics.grossProfit)}</p>
          <p className="text-[11px] text-ink/60 mt-1">Laba Kotor (Total Pendapatan - Modal Barang/HPP)</p>
        </div>
      </div>

      {/* ANALYTICS SECTION: VOUCHERS, AFFILIATES, GOOGLE ADS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-4">
        
        {/* VOUCHER ANALYTICS */}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink flex items-center gap-2 border-b border-ink/10 pb-1.5">
            <Ticket className="w-4 h-4 text-ink/80" /> Internal Vouchers
          </h2>
          
          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.015]">
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide">Code</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Net Profit</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Discount Cost</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Real ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {topVouchers.length === 0 ? (
                  <tr><td colSpan={4} className="px-2 py-4 text-center text-xs text-ink/80">No voucher data yet</td></tr>
                ) : (
                  topVouchers.map((v, i) => (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-1.5 py-1">
                        <p className="text-xs font-semibold text-ink">{v.code}</p>
                        <p className="text-[10px] text-ink/80 uppercase">{v.usages} uses</p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <p className={cn("text-xs font-mono", v.netProfit >= 0 ? "text-emerald-600" : "text-rose")}>
                          IDR {fIDR(v.netProfit)}
                        </p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <p className="text-xs font-mono text-rose">IDR {fIDR(v.discount)}</p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium",
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
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink flex items-center gap-2 border-b border-ink/10 pb-1.5">
            <Users className="w-4 h-4 text-ink/80" /> Affiliate Program
          </h2>

          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.015]">
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide">Affiliate</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Net Profit</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Comm Cost</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Real ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {topAffiliates.length === 0 ? (
                  <tr><td colSpan={4} className="px-2 py-4 text-center text-xs text-ink/80">No affiliate data yet</td></tr>
                ) : (
                  topAffiliates.map((a, i) => (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-1.5 py-1">
                        <p className="text-xs font-semibold text-ink truncate max-w-[100px]" title={a.name}>{a.name}</p>
                        <p className="text-[10px] text-ink/90 uppercase mt-0.5">{a.clicks} clicks • {a.orders} orders</p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <p className={cn("text-xs font-mono", a.netProfit >= 0 ? "text-emerald-600" : "text-rose")}>
                          IDR {fIDR(a.netProfit)}
                        </p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <p className="text-xs font-mono text-rose">IDR {fIDR(a.commission)}</p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium",
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

        {/* GOOGLE ADS ANALYTICS */}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink flex items-center justify-between border-b border-ink/10 pb-1.5">
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-ink/80" /> Google Ads</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-sm font-mono tracking-tight">Active API</span>
          </h2>

          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.015]">
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide">Campaign</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Spend</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-center">Traffic</th>
                  <th className="px-1.5 py-1 text-xs font-medium text-ink/80 uppercase tracking-wide text-right">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {metrics.googleAds.campaigns.length === 0 ? (
                  <tr><td colSpan={4} className="px-2 py-4 text-center text-xs text-ink/80">Belum ada data iklan berjalan</td></tr>
                ) : (
                  metrics.googleAds.campaigns.sort((a, b) => b.spend - a.spend).slice(0, 5).map((c, i) => (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-1.5 py-1">
                        <p className="text-xs font-semibold text-ink truncate max-w-[120px]" title={c.name}>{c.name}</p>
                        <p className="text-[10px] text-ink/80 uppercase">ID: {c.id.slice(-6)}</p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <p className="text-xs font-mono text-rose">IDR {fIDR(c.spend)}</p>
                        <p className="text-[10px] text-ink/60">{(c.spend/c.clicks || 0).toLocaleString('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0})}/clk</p>
                      </td>
                      <td className="px-1.5 py-1 text-center">
                        <p className="text-xs font-mono text-ink">{c.clicks}</p>
                        <p className="text-[10px] text-ink/60">{c.impressions} imp</p>
                      </td>
                      <td className="px-1.5 py-1 text-right">
                        <span className="px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium bg-emerald-50 text-emerald-700">
                          {c.conversions}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {metrics.googleAds.campaigns.length > 0 && (
            <p className="text-[10px] text-ink/50 text-right pt-1">
              Menampilkan {Math.min(5, metrics.googleAds.campaigns.length)} kampanye dengan pengeluaran tertinggi bulan ini.
            </p>
          )}
        </div>
      </div>

      {/* INVENTORY VALUATION UI */}
      <div className="pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink flex items-center gap-2 border-b border-ink/10 pb-1.5 mb-3">
          <PackageOpen className="w-4 h-4 text-ink/80" /> Inventory Valuation (All Stock)
        </h2>
        <div className="bg-ink text-white rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Total Nilai Persediaan Barang (COGS)</p>
            <p className="text-3xl font-mono tracking-tight text-white">IDR {fIDR(metrics.inventoryValue)}</p>
            <p className="text-[11px] text-white/60 mt-1">Estimasi nilai modal dari seluruh stok barang yang tersedia (HPP x Global Stock).</p>
          </div>
          <PackageOpen className="w-12 h-12 text-white/10" />
        </div>
      </div>

      {/* COSTING CONFIGURATION GRID */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-3 border-b border-ink/10 pb-1.5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-ink/80" /> Product Costing Configuration
          </h2>
          {Object.keys(editingCostings).length > 0 && (
            <button 
              onClick={saveCostings}
              disabled={savingCosting}
              className="px-3 py-1.5 bg-ink text-white text-[11px] uppercase tracking-wide font-semibold rounded-sm hover:bg-rose transition-colors flex items-center gap-1.5"
            >
              {savingCosting ? 'Saving...' : <><Save size={14}/> Save Changes</>}
            </button>
          )}
        </div>

        <div className="bg-white border border-ink/10 rounded-sm overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-ink/5 bg-ink/[0.015]">
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide sticky left-0 bg-white">Product</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide">Selling Price (IDR)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide">HPP Pabrik (IDR)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide">Packaging (IDR)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide text-rose">Biaya Retur (IDR)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide">Operational (IDR)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide">Target Margin (%)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide border-r border-ink/10">Target ROAS (x)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide bg-ink/[0.02]">Total COGS</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide bg-ink/[0.02]">Max CPA (Ad Spend)</th>
                <th className="px-1.5 py-1.5 text-xs font-medium text-ink/80 uppercase tracking-wide bg-ink/[0.02]">Est. Net Profit</th>
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
                const opsPct = Number(currentData.operational_pct) || 0; // treating as IDR
                const marginPct = Number(currentData.target_margin_pct) || 40;
                const roasPct = Number(currentData.target_roas) || 3;

                const opsCost = opsPct; // Fixed: treating as absolute value instead of percentage
                const totalCogs = hpp + pkg + opsCost; // Fixed: excluding ret (Biaya Retur) for now
                const maxCpa = roasPct > 0 ? sp / roasPct : 0;
                const estNetProfit = sp - totalCogs - maxCpa;
                const targetNetProfit = (marginPct / 100) * sp;
                const isUnderTarget = estNetProfit < targetNetProfit;
                
                return (
                  <tr key={p.id} className="hover:bg-ink/[0.01] transition-colors">
                    <td className="px-1.5 py-1 sticky left-0 bg-white group-hover:bg-ink/[0.01]">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-ink truncate max-w-[200px]" title={p.name}>{p.name}</p>
                        <p className="text-[10px] font-mono text-ink/60 uppercase">{p.variants?.[0]?.sku || 'NO-SKU'}</p>
                      </div>
                    </td>
                    <td className="px-1.5 py-1">
                      <p className="text-xs font-mono text-ink">IDR {fIDR(p.price)}</p>
                    </td>
                    <td className="px-1.5 py-1">
                      <input 
                        type="number"
                        min="0"
                        className="w-28 text-xs font-mono px-2 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.supplier_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'supplier_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <input 
                        type="number"
                        min="0"
                        className="w-24 text-xs font-mono px-2 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.packaging_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'packaging_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <input 
                        type="number"
                        min="0"
                        className="w-24 text-xs font-mono px-2 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-rose/50 focus:ring-1 focus:ring-rose/20 transition-all bg-rose/5 hover:bg-white text-rose"
                        value={currentData.return_cost ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'return_cost', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <input 
                        type="number"
                        min="0"
                        className="w-24 text-xs font-mono px-2 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                        value={currentData.operational_pct ?? ''}
                        onChange={(e) => handleCostingChange(p.id, 'operational_pct', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <div className="relative w-20">
                        <input 
                          type="number"
                          min="0"
                          className="w-full text-xs font-mono pl-2 pr-6 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                          value={currentData.target_margin_pct ?? ''}
                          onChange={(e) => handleCostingChange(p.id, 'target_margin_pct', e.target.value)}
                          placeholder="40"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-ink/50">%</span>
                      </div>
                    </td>
                    <td className="px-1.5 py-1 border-r border-ink/10">
                      <div className="relative w-20">
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          className="w-full text-xs font-mono pl-2 pr-6 py-1 border border-ink/10 rounded-sm focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20 transition-all bg-ink/[0.02] hover:bg-white"
                          value={currentData.target_roas ?? ''}
                          onChange={(e) => handleCostingChange(p.id, 'target_roas', e.target.value)}
                          placeholder="3"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-ink/50 font-bold">x</span>
                      </div>
                    </td>
                    <td className="px-1.5 py-1 bg-ink/[0.01]">
                      <p className="text-xs font-mono text-ink">IDR {fIDR(totalCogs)}</p>
                    </td>
                    <td className="px-1.5 py-1 bg-ink/[0.01]">
                      <p className="text-xs font-mono text-rose">IDR {fIDR(maxCpa)}</p>
                      <p className="text-[9px] text-ink/60 mt-0.5">Maks Iklan/Affiliate</p>
                    </td>
                    <td className="px-1.5 py-1 bg-ink/[0.01]">
                      <div className="flex flex-col gap-0.5">
                        <p className={cn("text-xs font-mono font-bold", estNetProfit >= 0 ? (isUnderTarget ? "text-amber-500" : "text-emerald-600") : "text-rose")}>
                          IDR {fIDR(estNetProfit)}
                        </p>
                        <p className="text-[10px] text-ink/60">
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
        <p className="text-xs text-ink/80 mt-2 italic bg-amber-50 p-2 rounded border border-amber-100">
          * Mengubah HPP akan langsung memperbarui kalkulasi Real ROAS dan Profit pada seluruh riwayat penjualan secara otomatis.
        </p>
      </div>

    </div>
  );
}
