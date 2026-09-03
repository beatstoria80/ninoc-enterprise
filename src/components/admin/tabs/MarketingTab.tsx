"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, Ticket, Shield, Users, ArrowUpRight, ArrowDownRight, PackageOpen, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMarketingAnalyticsData } from '@/actions/marketingAnalytics';
import { type GoogleAdsData, type GoogleAdsCampaign } from '@/actions/googleAds';

export function MarketingTab() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCOGS: 0,
    grossProfit: 0,
    marketingSpend: 0,
    inventoryValue: 0,
    googleAds: { configured: false, overview: { totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, averageCtr: 0, averageRoas: 0, cpa: 0, cpc: 0, cpm: 0 }, campaigns: [], trend: [] } as GoogleAdsData,
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
  
  // Removed costings state as it is now calculated on the server

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getMarketingAnalyticsData();
        setMetrics(data.metrics);
        setTopVouchers(data.topVouchers);
        setTopAffiliates(data.topAffiliates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
            <p className="flex justify-between font-semibold text-rose/90"><span>Google Ads Spend:</span> <span>IDR {fIDR(metrics.googleAds.overview?.totalSpend || 0)}</span></p>
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
                  metrics.googleAds.campaigns.sort((a: GoogleAdsCampaign, b: GoogleAdsCampaign) => b.spend - a.spend).slice(0, 5).map((c: GoogleAdsCampaign, i: number) => (
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



    </div>
  );
}
