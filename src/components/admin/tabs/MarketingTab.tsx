"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Ticket, Shield, Users, DollarSign, Activity, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketingTab() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalMarketingRevenue: 0,
    totalMarketingCost: 0,
    roas: 0,
    vouchers: {
      totalUsages: 0,
      totalDiscountGiven: 0,
      totalRevenue: 0,
      roas: 0
    },
    affiliates: {
      totalClicks: 0,
      totalOrders: 0,
      totalCommission: 0,
      totalDiscountGiven: 0,
      totalRevenue: 0,
      roas: 0
    }
  });

  const [topVouchers, setTopVouchers] = useState<any[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch Voucher Data
        const { data: voucherUsages } = await supabase.from('voucher_usages').select('*, vouchers(code, type), orders(total_price)');
        // Fetch Affiliate Data
        const { data: affiliates } = await supabase.from('affiliates').select('*');
        const { data: affiliateClicks } = await supabase.from('affiliate_clicks').select('*');
        const { data: affiliateOrders } = await supabase.from('orders').select('*').not('affiliate_code', 'is', null);

        // Process Vouchers
        let vUsages = 0;
        let vDiscount = 0;
        let vRevenue = 0;
        const vMap: any = {};

        if (voucherUsages) {
          vUsages = voucherUsages.length;
          voucherUsages.forEach(vu => {
            vDiscount += vu.discount_applied || 0;
            const rev = vu.orders?.total_price || 0;
            vRevenue += rev;
            
            const code = vu.vouchers?.code || 'UNKNOWN';
            if (!vMap[code]) vMap[code] = { code, usages: 0, discount: 0, revenue: 0, type: vu.vouchers?.type };
            vMap[code].usages++;
            vMap[code].discount += vu.discount_applied || 0;
            vMap[code].revenue += rev;
          });
        }
        
        const vTop = Object.values(vMap).map((v: any) => ({
          ...v,
          roas: v.discount > 0 ? (v.revenue / v.discount) * 100 : (v.revenue > 0 ? 9999 : 0)
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        // Process Affiliates
        let aClicks = affiliateClicks?.length || 0;
        let aOrdersCount = affiliateOrders?.length || 0;
        let aRevenue = 0;
        let aCommission = 0;
        let aTotalEarnings = 0;
        const aMap: any = {};
        
        if (affiliates) {
          affiliates.forEach(af => {
            aTotalEarnings += af.total_earnings || 0;
            aMap[af.code] = { 
              name: af.name || 'Unknown', 
              code: af.code, 
              clicks: 0, 
              orders: 0, 
              revenue: 0, 
              commission: af.total_earnings || 0 
            };
          });
        }

        if (affiliateClicks) {
          affiliateClicks.forEach(ac => {
            if (aMap[ac.affiliate_code]) aMap[ac.affiliate_code].clicks++;
          });
        }

        if (affiliateOrders) {
          affiliateOrders.forEach(ao => {
            aRevenue += ao.total_price || 0;
            if (aMap[ao.affiliate_code]) {
              aMap[ao.affiliate_code].orders++;
              aMap[ao.affiliate_code].revenue += ao.total_price || 0;
            }
          });
        }
        
        const aTop = Object.values(aMap).filter((a: any) => a.orders > 0 || a.clicks > 0).map((a: any) => ({
          ...a,
          roas: a.commission > 0 ? (a.revenue / a.commission) * 100 : (a.revenue > 0 ? 9999 : 0),
          cvr: a.clicks > 0 ? (a.orders / a.clicks) * 100 : 0
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        const totalCost = vDiscount + aTotalEarnings;
        const totalRev = vRevenue + aRevenue;

        setMetrics({
          totalMarketingRevenue: totalRev,
          totalMarketingCost: totalCost,
          roas: totalCost > 0 ? (totalRev / totalCost) * 100 : (totalRev > 0 ? 9999 : 0),
          vouchers: {
            totalUsages: vUsages,
            totalDiscountGiven: vDiscount,
            totalRevenue: vRevenue,
            roas: vDiscount > 0 ? (vRevenue / vDiscount) * 100 : (vRevenue > 0 ? 9999 : 0)
          },
          affiliates: {
            totalClicks: aClicks,
            totalOrders: aOrdersCount,
            totalCommission: aTotalEarnings,
            totalDiscountGiven: 0, 
            totalRevenue: aRevenue,
            roas: aTotalEarnings > 0 ? (aRevenue / aTotalEarnings) * 100 : (aRevenue > 0 ? 9999 : 0)
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
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <TrendingUp className="w-8 h-8 animate-pulse text-ink mb-4" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-ink">Menghitung Data ROAS...</p>
      </div>
    );
  }

  // Format IDR helper
  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-medium tracking-tight text-ink flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Marketing & ROAS Analytics
        </h1>
        <p className="text-[11px] text-ink/50 mt-1 uppercase tracking-widest">
          Pantau efisiensi program promosi (Voucher & Referral) terhadap pendapatan.
        </p>
      </div>

      {/* OVERALL ROAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-ink/10 rounded-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={64} /></div>
          <p className="text-[9px] font-semibold text-ink/50 uppercase tracking-widest mb-1">Overall ROAS</p>
          <p className="text-2xl font-mono tracking-tight text-ink">{metrics.roas.toFixed(2)}%</p>
          <div className="flex items-center gap-1 mt-2 text-[10px]">
            {metrics.roas >= 100 ? (
              <span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight size={12}/> Profitable</span>
            ) : (
              <span className="text-rose flex items-center gap-1"><ArrowDownRight size={12}/> Boncos</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5">
          <p className="text-[9px] font-semibold text-ink/50 uppercase tracking-widest mb-1">Total Marketing Cost</p>
          <p className="text-2xl font-mono tracking-tight text-rose">IDR {fIDR(metrics.totalMarketingCost)}</p>
          <p className="text-[9px] text-ink/40 mt-2">Diskon voucher + Komisi afiliator</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-sm p-5">
          <p className="text-[9px] font-semibold text-ink/50 uppercase tracking-widest mb-1">Marketing Revenue</p>
          <p className="text-2xl font-mono tracking-tight text-emerald-600">IDR {fIDR(metrics.totalMarketingRevenue)}</p>
          <p className="text-[9px] text-ink/40 mt-2">Pendapatan kotor dari transaksi promo</p>
        </div>
      </div>

      {/* TWO COLUMNS: VOUCHERS vs AFFILIATES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* VOUCHER ANALYTICS */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink flex items-center gap-2 border-b border-ink/10 pb-2">
            <Ticket className="w-4 h-4 text-ink/40" /> Internal Vouchers
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ink/[0.02] border border-ink/5 p-4 rounded-sm">
              <p className="text-[9px] font-medium text-ink/40 uppercase tracking-widest mb-1">Voucher ROAS</p>
              <p className="text-lg font-mono text-ink">{metrics.vouchers.roas.toFixed(1)}%</p>
            </div>
            <div className="bg-ink/[0.02] border border-ink/5 p-4 rounded-sm">
              <p className="text-[9px] font-medium text-ink/40 uppercase tracking-widest mb-1">Total Usages</p>
              <p className="text-lg font-mono text-ink">{metrics.vouchers.totalUsages}x</p>
            </div>
          </div>

          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-ink/5 bg-ink/[0.015]">
              <p className="text-[9px] font-semibold text-ink uppercase tracking-widest">Top Performing Vouchers</p>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5">
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Code</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Revenue</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Cost</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">ROAS</th>
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
                        <p className="text-[10px] font-mono text-emerald-600">IDR {fIDR(v.revenue)}</p>
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
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ink/[0.02] border border-ink/5 p-4 rounded-sm">
              <p className="text-[9px] font-medium text-ink/40 uppercase tracking-widest mb-1">Affiliate ROAS</p>
              <p className="text-lg font-mono text-ink">{metrics.affiliates.roas.toFixed(1)}%</p>
            </div>
            <div className="bg-ink/[0.02] border border-ink/5 p-4 rounded-sm">
              <p className="text-[9px] font-medium text-ink/40 uppercase tracking-widest mb-1">Total Clicks</p>
              <p className="text-lg font-mono text-ink">{metrics.affiliates.totalClicks}</p>
            </div>
          </div>

          <div className="bg-white border border-ink/10 rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-ink/5 bg-ink/[0.015]">
              <p className="text-[9px] font-semibold text-ink uppercase tracking-widest">Top Affiliates</p>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/5">
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest">Affiliate</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Revenue</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">Comm</th>
                  <th className="px-4 py-2 text-[8px] font-medium text-ink/40 uppercase tracking-widest text-right">ROAS</th>
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
                        <p className="text-[8px] text-ink/40 font-mono mt-0.5">{a.code}</p>
                        <p className="text-[7px] text-ink/30 uppercase tracking-wider mt-0.5">{a.clicks} clicks • {a.cvr.toFixed(1)}% CVR</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-[10px] font-mono text-emerald-600">IDR {fIDR(a.revenue)}</p>
                        <p className="text-[8px] text-ink/40 mt-0.5">{a.orders} orders</p>
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
    </div>
  );
}
