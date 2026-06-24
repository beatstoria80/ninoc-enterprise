"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, MousePointerClick, Eye, Target, AlertCircle } from 'lucide-react';
import { getGoogleAdsData, type GoogleAdsData } from '@/actions/googleAds';
import { cn } from '@/lib/utils';

export function GoogleAdsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GoogleAdsData | null>(null);

  async function loadAdsData() {
    try {
      setLoading(true);
      const adsData = await getGoogleAdsData();
      setData(adsData);
    } catch (error) {
      console.error('Error fetching Google Ads data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdsData();
  }, []);

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <TrendingUp className="w-8 h-8 animate-pulse text-ink mb-4" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-ink">Menghubungkan ke Google Ads API...</p>
      </div>
    );
  }

  if (!data) return null;

  const avgCpc = data.totalClicks > 0 ? data.totalSpend / data.totalClicks : 0;
  const overallCtr = data.totalImpressions > 0 ? (data.totalClicks / data.totalImpressions) * 100 : 0;

  return (
    <div className="space-y-4 w-full pb-20">
      <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-ink flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose" />
            Google Ads Mirror Dashboard
          </h1>
          <p className="text-xs md:text-sm text-ink/80 mt-1">
            Real-time synchronization with your Google Ads account. (THIS_MONTH)
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-sm flex items-center gap-1.5 border border-emerald-200">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">API CONNECTED</span>
        </div>
      </div>

      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-ink text-white rounded-md p-3 flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp size={12}/> Total Spend</p>
          <p className="text-2xl font-mono tracking-tight text-rose">IDR {fIDR(data.totalSpend)}</p>
        </div>
        
        <div className="bg-white border border-ink/10 rounded-md p-3 flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-semibold text-ink/70 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MousePointerClick size={12}/> Total Clicks</p>
          <p className="text-2xl font-mono tracking-tight text-ink">{data.totalClicks.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-md p-3 flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-semibold text-ink/70 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Eye size={12}/> Impressions</p>
          <p className="text-2xl font-mono tracking-tight text-ink">{data.totalImpressions.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-ink/10 rounded-md p-3 flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-semibold text-ink/70 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target size={12}/> Conversions</p>
          <p className="text-2xl font-mono tracking-tight text-emerald-600">{data.totalConversions.toLocaleString()}</p>
        </div>

        <div className="bg-ink/[0.02] border border-ink/10 rounded-md p-3 flex flex-col justify-between shadow-sm">
           <div className="flex justify-between items-start mb-1">
             <p className="text-[10px] font-semibold text-ink/70 uppercase tracking-wider">Avg CPC & CTR</p>
           </div>
           <div>
             <p className="text-lg font-mono tracking-tight text-ink">IDR {fIDR(avgCpc)} <span className="text-[10px] text-ink/50 uppercase">/clk</span></p>
             <p className="text-sm font-mono tracking-tight text-ink/80 mt-0.5">{overallCtr.toFixed(2)}% <span className="text-[10px] text-ink/50 uppercase">CTR</span></p>
           </div>
        </div>
      </div>

      {/* CAMPAIGN TABLE */}
      <div className="bg-white border border-ink/10 rounded-md overflow-hidden mt-2 shadow-sm">
        <div className="p-3 border-b border-ink/10 bg-ink/[0.015] flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink">Campaign Performance</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/10 bg-white">
                <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider">Campaign Name</th>
                <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-right">Spend (IDR)</th>
                <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-right">Clicks</th>
                <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-right">Impr.</th>
                <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-right">CTR</th>
                <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-right">Avg CPC</th>
                <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-center">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center text-ink/50">
                      <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                      <p className="text-xs font-medium uppercase tracking-widest">Belum ada data kampanye bulan ini</p>
                      <p className="text-[10px] mt-1">Pastikan iklan Anda sedang berjalan aktif di Google Ads Manager.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.campaigns.sort((a, b) => b.spend - a.spend).map((c, i) => {
                  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                  const cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
                  return (
                    <tr key={i} className="hover:bg-ink/[0.01] transition-colors">
                      <td className="px-3 py-2">
                        <p className="text-xs font-semibold text-ink">{c.name}</p>
                        <p className="text-[9px] text-ink/50 uppercase tracking-wider mt-0.5">ID: {c.id}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <p className="text-xs font-mono font-medium text-rose">{fIDR(c.spend)}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <p className="text-xs font-mono text-ink">{c.clicks.toLocaleString()}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <p className="text-xs font-mono text-ink/80">{c.impressions.toLocaleString()}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <p className="text-xs font-mono text-ink/80">{ctr.toFixed(2)}%</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <p className="text-xs font-mono text-ink/80">{fIDR(cpc)}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {c.conversions}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
