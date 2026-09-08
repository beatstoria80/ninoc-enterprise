"use client";

import React from 'react';
import { TrendingUp, MousePointerClick, Eye, Target, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { GoogleAdsData } from '@/services/google/types';
import { GoogleAdsTable } from './GoogleAdsTable';

export function GoogleAdsAnalyticsView({ 
  data, 
  timeFilter,
  selectedCampaignIds,
  setSelectedCampaignIds
}: { 
  data: GoogleAdsData; 
  timeFilter: string;
  selectedCampaignIds: Set<string>;
  setSelectedCampaignIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const fIDR = (num: any) => {
    const validNum = Number(num);
    if (isNaN(validNum) || validNum == null) return '0';
    return validNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const filteredCampaigns = data.campaigns.filter(c => selectedCampaignIds.has(c.id));
  
  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const averageRoas = totalSpend > 0 && totalConversions > 0 ? ((totalConversions * 150000) / totalSpend) : 0;

  const dynamicOverview = {
    totalSpend,
    totalConversions,
    totalClicks,
    totalImpressions,
    cpa,
    cpc,
    cpm,
    averageCtr,
    averageRoas
  };

  const dynamicTrend = React.useMemo(() => {
    const filteredPoints = data.trend.filter(t => selectedCampaignIds.has(t.campaignId || ''));
    
    const aggregated = filteredPoints.reduce((acc, t) => {
      if (!acc[t.date]) acc[t.date] = { spend: 0, conversions: 0 };
      acc[t.date].spend += t.spend;
      acc[t.date].conversions += t.conversions;
      return acc;
    }, {} as Record<string, { spend: number; conversions: number }>);

    const result = [];
    const daysCount = timeFilter === '7d' ? 7 : timeFilter === '28d' ? 30 : timeFilter === '90d' ? 90 : timeFilter === '24h' ? 1 : 30;
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      result.push({
        date: dateStr,
        spend: aggregated[dateStr]?.spend || 0,
        conversions: aggregated[dateStr]?.conversions || 0
      });
    }
    return result;
  }, [data.trend, selectedCampaignIds, timeFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Top Metrics Grid - Compact & Data Dense */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-600 text-white rounded-lg p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-white/20 transition-colors" />
          <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><DollarSign size={12}/> Biaya Iklan</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-mono tracking-tight font-medium">Rp {fIDR(dynamicOverview.totalSpend)}</p>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-lg p-3 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Target size={12}/> Konversi</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-mono tracking-tight text-emerald-600 font-medium">{dynamicOverview.totalConversions.toLocaleString('id-ID')}</p>
            <p className="text-[9px] text-ink/40 font-mono">Rp {fIDR(dynamicOverview.cpa)} CPA</p>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-lg p-3 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MousePointerClick size={12}/> Klik</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-mono tracking-tight text-ink font-medium">{dynamicOverview.totalClicks.toLocaleString('id-ID')}</p>
            <p className="text-[9px] text-ink/40 font-mono">Rp {fIDR(dynamicOverview.cpc)} CPC</p>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-lg p-3 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Eye size={12}/> Tayangan</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-mono tracking-tight text-ink font-medium">{dynamicOverview.totalImpressions.toLocaleString('id-ID')}</p>
            <p className="text-[9px] text-ink/40 font-mono">Rp {fIDR(dynamicOverview.cpm)} CPM</p>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">Avg ROAS & CTR</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-mono tracking-tight text-emerald-700 font-medium">{dynamicOverview.averageRoas.toFixed(1)}x</p>
            <p className="text-[10px] font-bold text-emerald-600/70 mt-1">{dynamicOverview.averageCtr.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              Performa Google Ads
            </h3>
            <p className="text-[11px] text-ink/60 mt-1">Tren Biaya (Spend) vs Konversi</p>
          </div>
        </div>
        
        <div className="h-72 w-full">
          {dynamicTrend && dynamicTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpendG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConvG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  }}
                  minTickGap={30}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(val)}`}
                  width={60}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  formatter={(value: any, name: any) => {
                    if (name === 'spend') return [`Rp ${fIDR(value)}`, 'Biaya (Spend)'];
                    if (name === 'conversions') return [value, 'Konversi'];
                    return [value, name];
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#2563eb" strokeWidth={2} fill="url(#colorSpendG)" name="spend" />
                <Area yAxisId="right" type="monotone" dataKey="conversions" stroke="#059669" strokeWidth={2} fill="url(#colorConvG)" name="conversions" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-ink/40 bg-ink/[0.01] rounded-lg border border-dashed border-ink/10">
              <Activity size={24} className="mb-2 opacity-30" />
              <p className="text-xs">Data trend tidak tersedia untuk periode ini</p>
            </div>
          )}
        </div>
      </div>

      <GoogleAdsTable 
        data={data} 
        timeFilter={timeFilter} 
        selectedCampaignIds={selectedCampaignIds} 
        setSelectedCampaignIds={setSelectedCampaignIds} 
      />
      
    </div>
  );
}
