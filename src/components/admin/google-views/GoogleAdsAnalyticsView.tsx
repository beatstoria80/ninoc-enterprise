"use client";

import React, { useState } from 'react';
import { TrendingUp, MousePointerClick, Eye, Target, DollarSign, Activity, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { GoogleAdsData } from '@/services/google/types';
import { GoogleAdsTable } from './GoogleAdsTable';
import { useGoogleAdsAnalytics } from '@/hooks/admin/useGoogleAdsAnalytics';

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

  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['clicks', 'impressions', 'spend', 'ctr']));

  const toggleMetric = (metric: string) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      if (next.has(metric)) {
        if (next.size > 1) next.delete(metric); // Keep at least one active
      } else {
        next.add(metric);
      }
      return next;
    });
  };

  const { filteredCampaigns, dynamicOverview, dynamicTrend } = useGoogleAdsAnalytics(
    data,
    selectedCampaignIds,
    timeFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Native Google Ads Chart UI */}
      <div className="bg-white border border-ink/10 rounded-xl shadow-sm overflow-hidden mb-6">
        
        {/* 4 Colored Metric Blocks (Legend & Header) */}
        <div className="flex w-full overflow-x-auto">
          {/* Blue - Klik */}
          <div 
            onClick={() => toggleMetric('clicks')}
            className={cn(
              "flex-1 min-w-[140px] bg-[#1a73e8] text-white p-4 border-r border-white/10 flex flex-col justify-between cursor-pointer transition-all hover:opacity-100 relative",
              !activeMetrics.has('clicks') && "opacity-40 saturate-50 hover:opacity-70"
            )}
          >
            {activeMetrics.has('clicks') && <CheckCircle2 size={16} className="absolute top-3 right-3 text-white/50" />}
            <div className="flex items-center gap-1 opacity-90 mb-3">
              <MousePointerClick size={12} />
              <p className="text-[11px] font-medium tracking-wide uppercase">Klik</p>
            </div>
            <p className="text-2xl md:text-3xl font-light">{dynamicOverview.totalClicks.toLocaleString('id-ID')}</p>
          </div>
          
          {/* Red - Tayangan */}
          <div 
            onClick={() => toggleMetric('impressions')}
            className={cn(
              "flex-1 min-w-[140px] bg-[#d93025] text-white p-4 border-r border-white/10 flex flex-col justify-between cursor-pointer transition-all hover:opacity-100 relative",
              !activeMetrics.has('impressions') && "opacity-40 saturate-50 hover:opacity-70"
            )}
          >
            {activeMetrics.has('impressions') && <CheckCircle2 size={16} className="absolute top-3 right-3 text-white/50" />}
            <div className="flex items-center gap-1 opacity-90 mb-3">
              <Eye size={12} />
              <p className="text-[11px] font-medium tracking-wide uppercase">Tayangan</p>
            </div>
            <p className="text-2xl md:text-3xl font-light">{dynamicOverview.totalImpressions.toLocaleString('id-ID')}</p>
          </div>

          {/* Yellow - Biaya */}
          <div 
            onClick={() => toggleMetric('spend')}
            className={cn(
              "flex-1 min-w-[140px] bg-[#f29900] text-white p-4 border-r border-white/10 flex flex-col justify-between cursor-pointer transition-all hover:opacity-100 relative",
              !activeMetrics.has('spend') && "opacity-40 saturate-50 hover:opacity-70"
            )}
          >
            {activeMetrics.has('spend') && <CheckCircle2 size={16} className="absolute top-3 right-3 text-white/50" />}
            <div className="flex items-center gap-1 opacity-90 mb-3">
              <DollarSign size={12} />
              <p className="text-[11px] font-medium tracking-wide uppercase">Biaya</p>
            </div>
            <p className="text-xl md:text-2xl font-light">Rp {fIDR(dynamicOverview.totalSpend)}</p>
          </div>

          {/* Green - CTR */}
          <div 
            onClick={() => toggleMetric('ctr')}
            className={cn(
              "flex-1 min-w-[140px] bg-[#188038] text-white p-4 flex flex-col justify-between cursor-pointer transition-all hover:opacity-100 relative",
              !activeMetrics.has('ctr') && "opacity-40 saturate-50 hover:opacity-70"
            )}
          >
            {activeMetrics.has('ctr') && <CheckCircle2 size={16} className="absolute top-3 right-3 text-white/50" />}
            <div className="flex items-center gap-1 opacity-90 mb-3">
              <Activity size={12} />
              <p className="text-[11px] font-medium tracking-wide uppercase">CTR</p>
            </div>
            <p className="text-2xl md:text-3xl font-light">{dynamicOverview.averageCtr.toFixed(2)}%</p>
          </div>
        </div>

        {/* The Graph */}
        <div className="p-4 pt-8 h-[320px] w-full">
          {dynamicTrend && dynamicTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpendG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f29900" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f29900" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConvG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicksG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorImpG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d93025" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#d93025" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCtrG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#188038" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#188038" stopOpacity={0}/>
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
                  tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(val)}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  formatter={(value: any, name: any) => {
                    if (name === 'spend') return [`Rp ${fIDR(value)}`, 'Biaya (Spend)'];
                    if (name === 'conversions') return [value, 'Konversi'];
                    if (name === 'clicks') return [value.toLocaleString('id-ID'), 'Klik'];
                    if (name === 'impressions') return [value.toLocaleString('id-ID'), 'Tayangan'];
                    if (name === 'ctr') return [`${Number(value).toFixed(2)}%`, 'CTR'];
                    return [value, name];
                  }}
                />
                {activeMetrics.has('spend') && <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#f29900" strokeWidth={2} fill="url(#colorSpendG)" name="spend" />}
                {activeMetrics.has('clicks') && <Area yAxisId="right" type="monotone" dataKey="clicks" stroke="#1a73e8" strokeWidth={2} fill="url(#colorClicksG)" name="clicks" />}
                {activeMetrics.has('impressions') && <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#d93025" strokeWidth={2} fill="url(#colorImpG)" name="impressions" />}
                {activeMetrics.has('ctr') && <Area yAxisId="right" type="monotone" dataKey="ctr" stroke="#188038" strokeWidth={2} fill="url(#colorCtrG)" name="ctr" />}
                {activeMetrics.has('conversions') && <Area yAxisId="right" type="monotone" dataKey="conversions" stroke="#9333ea" strokeWidth={2} fill="url(#colorConvG)" name="conversions" />}
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
