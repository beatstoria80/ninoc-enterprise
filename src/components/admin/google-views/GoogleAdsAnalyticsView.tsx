"use client";

import React from 'react';
import { TrendingUp, MousePointerClick, Eye, Target, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { GoogleAdsData } from '@/services/google/types';
import { GoogleAdsTable } from './GoogleAdsTable';

export function GoogleAdsAnalyticsView({ data, timeFilter }: { data: GoogleAdsData; timeFilter: string }) {
  const { overview, trend } = data;

  const fIDR = (num: any) => {
    const validNum = Number(num);
    if (isNaN(validNum) || validNum == null) return '0';
    return validNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-600 text-white rounded-xl p-4 shadow-[0_4px_12px_rgba(37,99,235,0.2)] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-colors" />
          <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={14}/> Total Spend</p>
          <div>
            <p className="text-2xl md:text-3xl font-mono tracking-tight font-light">Rp {fIDR(overview.totalSpend)}</p>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Target size={14}/> Konversi (Pembelian)</p>
          <div>
            <p className="text-2xl md:text-3xl font-mono tracking-tight text-emerald-600">{overview.totalConversions.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-ink/50 mt-1 font-mono">Rp {fIDR(overview.cpa)} CPA</p>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MousePointerClick size={14}/> Total Klik</p>
          <div>
            <p className="text-2xl md:text-3xl font-mono tracking-tight text-ink">{overview.totalClicks.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-ink/50 mt-1 font-mono">Rp {fIDR(overview.cpc)} CPC</p>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Eye size={14}/> Tayangan (Impr)</p>
          <div>
            <p className="text-2xl md:text-3xl font-mono tracking-tight text-ink">{overview.totalImpressions.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-ink/50 mt-1 font-mono">Rp {fIDR(overview.cpm)} CPM</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <p className="text-[11px] font-semibold text-emerald-800/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">Avg ROAS & CTR</p>
          <div>
            <p className="text-2xl md:text-3xl font-mono tracking-tight text-emerald-700">{overview.averageRoas.toFixed(2)}x</p>
            <p className="text-[11px] text-emerald-600/70 mt-1 font-mono">{overview.averageCtr.toFixed(2)}% CTR</p>
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
          {trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`}
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

      <GoogleAdsTable data={data} timeFilter={timeFilter} />
      
    </div>
  );
}
