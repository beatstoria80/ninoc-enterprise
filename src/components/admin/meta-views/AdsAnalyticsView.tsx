"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Target, MousePointer, Eye, TrendingUp, AlertCircle } from 'lucide-react';
import type { MetaAnalyticsData } from '@/actions/metaAnalytics';

interface AdsAnalyticsViewProps {
  data: MetaAnalyticsData;
  timeFilter: string;
}

export function AdsAnalyticsView({ data, timeFilter }: AdsAnalyticsViewProps) {
  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const getTimeLabel = () => {
    switch (timeFilter) {
      case '24h': return '24 JAM';
      case '7d': return '7 HARI';
      case '28d': return '28 HARI';
      case '90d': return '3 BULAN';
      case 'all': return 'SEMUA PERIODE';
      default: return '28 HARI';
    }
  };

  if (data.error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold">Data Iklan Tidak Tersedia</p>
          <p className="text-xs text-red-700 leading-relaxed">{data.error.replace(/Menampilkan data simulasi\./gi, '')}</p>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Spend */}
        <div className="bg-white/80 backdrop-blur-md border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-rose-500" /> Ad Spend
              </p>
            </div>
            <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">Rp {fIDR(data.overview.totalSpend)}</p>
          </div>
          <p className="text-[10px] text-ink/60 mt-2 font-medium border-t border-ink/5 pt-1.5">
            Total biaya iklan di {getTimeLabel()}
          </p>
        </div>

        {/* ROAS */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-700 rounded-xl p-4 shadow-sm text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={14} className="text-emerald-200" /> ROAS
              </p>
            </div>
            <p className="text-3xl font-mono font-extrabold tracking-tight mt-1">{data.overview.averageRoas.toFixed(2)}x</p>
          </div>
          <p className="text-[10px] text-emerald-100 mt-2 font-medium border-t border-emerald-400/30 pt-1.5">
            Return on Ad Spend
          </p>
        </div>

        {/* Clicks */}
        <div className="bg-white/80 backdrop-blur-md border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                <MousePointer size={14} className="text-blue-500" /> Link Clicks
              </p>
            </div>
            <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">{data.overview.totalClicks.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-ink/60 mt-2 font-medium border-t border-ink/5 pt-1.5">
            CTR: {data.overview.averageCtr.toFixed(2)}%
          </p>
        </div>

        {/* Impressions */}
        <div className="bg-white/80 backdrop-blur-md border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-sky-500" /> Impressions
              </p>
            </div>
            <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">{data.overview.totalImpressions.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-ink/60 mt-2 font-medium border-t border-ink/5 pt-1.5">
            Jumlah iklan ditampilkan
          </p>
        </div>
      </div>

      <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-blue-600" /> Performa Harian ({getTimeLabel()})
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#f43f5e" strokeWidth={2} fill="url(#colorSpend)" name="Ad Spend (Rp)" />
              <Area yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} fill="url(#colorConv)" name="Conversions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </React.Fragment>
  );
}
