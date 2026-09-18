"use client";

import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Target, MousePointer, Eye, TrendingUp, BarChart2, AlertCircle, ShoppingCart, Activity, ArrowUpRight, ArrowDownRight, Download, Loader2 } from 'lucide-react';
import type { MetaAnalyticsData } from '@/services/meta/types';
import { cn } from '@/lib/utils';
import { MetaAdsTable } from './MetaAdsTable';
import { getCampaignTrendAction } from '@/actions/metaAnalytics';
import { LandscapeChartPreview } from '@/components/admin/ui/LandscapeChartPreview';

interface AdsAnalyticsViewProps {
  data: MetaAnalyticsData;
  timeFilter: string;
}

export function AdsAnalyticsView({ data, timeFilter }: AdsAnalyticsViewProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [fetchedTrend, setFetchedTrend] = useState<any>(null);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [chartStyle, setChartStyle] = useState<'line' | 'bar'>('line');
  const [activeMetrics, setActiveMetrics] = useState({
    spend: true,
    conversions: true,
    impressions: false,
    clicks: false,
    roas: false,
    cpa: false,
    cpm: false,
    ctr: false
  });

  const trendData = selectedCampaign === 'all' ? data.trend : (fetchedTrend || []);

  useEffect(() => {
    if (selectedCampaign === 'all') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetchedTrend(null);
      return;
    }
    let active = true;
    setLoadingTrend(true);
    getCampaignTrendAction(selectedCampaign, timeFilter).then(res => {
      if (active) {
        setFetchedTrend(res);
        setLoadingTrend(false);
      }
    });
    return () => { active = false; };
  }, [selectedCampaign, timeFilter]);

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const fIDR = (num: any) => {
    const validNum = Number(num);
    if (isNaN(validNum) || validNum == null) return '0';
    return validNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

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

  const handleDownloadCSV = () => {
    const csvRows = [];
    csvRows.push(['NINOC Ads Report', `Periode: ${getTimeLabel()}`]);
    csvRows.push([]);
    csvRows.push(['Overview']);
    csvRows.push(['Ad Spend', 'ROAS', 'CPA', 'CPM', 'Total Conversions', 'Total Impressions', 'Total Clicks', 'CPC', 'CTR']);
    csvRows.push([
      data.overview.totalSpend,
      data.overview.averageRoas.toFixed(2),
      data.overview.cpa,
      data.overview.cpm,
      data.overview.totalConversions,
      data.overview.totalImpressions,
      data.overview.totalClicks,
      data.overview.cpc,
      (data.overview.averageCtr / 100).toFixed(4)
    ]);
    csvRows.push([]);
    csvRows.push(['Trend Performa Harian']);
    csvRows.push(['Tanggal', 'Spend', 'Conversions']);
    data.trend.forEach(t => {
      csvRows.push([t.date, t.spend, t.conversions]);
    });
    csvRows.push([]);
    csvRows.push(['Rincian Kampanye']);
    csvRows.push(['Nama', 'ID', 'Status', 'Spend', 'Pembelian', 'CPA', 'ROAS']);
    data.campaigns.forEach(c => {
      const safeName = `"${c.name.replace(/"/g, '""')}"`;
      csvRows.push([safeName, c.id, c.status, c.spend, c.conversions, c.cpa, c.roas.toFixed(2)]);
    });

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NINOC_Ads_Report_${timeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="space-y-3 -mt-2">
      
      {/* HEADER & ACTIONS */}
      <div className="flex items-center justify-end animate-in fade-in slide-in-from-top-2 duration-500">
        <button 
          onClick={handleDownloadCSV} 
          className="text-[10px] font-bold text-ink/80 bg-white border border-ink/10 shadow-sm px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-ink/[0.02] hover:text-ink transition-colors"
        >
          <Download size={12} /> Download Laporan CSV
        </button>
      </div>

      {/* KPI RIBBON - TOP 4 PRIMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Spend */}
        <div className="bg-white/90 backdrop-blur-md border border-ink/10 rounded-lg p-2.5 md:p-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={40} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-rose-50 flex items-center justify-center">
                <DollarSign size={12} className="text-rose-600" />
              </div>
              <p className="text-[10px] font-bold text-ink/60 uppercase tracking-wider">Ad Spend</p>
            </div>
            <p className="text-xl md:text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">Rp {fIDR(data.overview.totalSpend)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-ink/5 pt-1.5">
            <p className="text-[9px] text-ink/50 font-medium uppercase">Total biaya di {getTimeLabel()}</p>
          </div>
        </div>

        {/* ROAS */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-2.5 md:p-3 shadow-sm text-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Target size={40} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Target size={12} className="text-white" />
              </div>
              <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-wider">ROAS (Est)</p>
            </div>
            <p className="text-xl md:text-2xl font-mono font-extrabold tracking-tight mt-1">{data.overview.averageRoas.toFixed(2)}x</p>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-1.5">
            <p className="text-[9px] text-emerald-100 font-medium uppercase">Return on Ad Spend</p>
            {data.overview.averageRoas >= 3 ? (
              <span className="flex items-center text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded text-white shadow-sm">Profit <ArrowUpRight size={10} className="ml-0.5"/></span>
            ) : (
              <span className="flex items-center text-[9px] font-bold bg-black/20 px-1.5 py-0.5 rounded text-white shadow-sm">Rugi <ArrowDownRight size={10} className="ml-0.5"/></span>
            )}
          </div>
        </div>

        {/* CPA (Cost Per Action) */}
        <div className="bg-white/90 backdrop-blur-md border border-ink/10 rounded-lg p-2.5 md:p-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingCart size={40} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
                <ShoppingCart size={12} className="text-amber-600" />
              </div>
              <p className="text-[10px] font-bold text-ink/60 uppercase tracking-wider">CPA / CPP</p>
            </div>
            <p className="text-xl md:text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">Rp {fIDR(data.overview.cpa)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-ink/5 pt-1.5">
            <p className="text-[9px] text-ink/50 font-medium uppercase">Cost per Purchase</p>
            <p className="text-[9px] font-bold text-ink/80">{data.overview.totalConversions.toLocaleString()} Terjual</p>
          </div>
        </div>

        {/* CPM (Cost Per Mille) */}
        <div className="bg-white/90 backdrop-blur-md border border-ink/10 rounded-lg p-2.5 md:p-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Eye size={40} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-sky-50 flex items-center justify-center">
                <Eye size={12} className="text-sky-600" />
              </div>
              <p className="text-[10px] font-bold text-ink/60 uppercase tracking-wider">CPM</p>
            </div>
            <p className="text-xl md:text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">Rp {fIDR(data.overview.cpm)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-ink/5 pt-1.5">
            <p className="text-[9px] text-ink/50 font-medium uppercase">Cost per 1.000 Impr</p>
            <p className="text-[9px] font-bold text-ink/80">{fIDR(data.overview.totalImpressions)} Impr</p>
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS (CPC, CTR, Clicks) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="bg-ink/[0.02] border border-ink/5 rounded-lg p-2 flex items-center gap-2">
          <div className="p-1.5 bg-white rounded flex-shrink-0 shadow-sm text-blue-500"><MousePointer size={12}/></div>
          <div>
            <p className="text-[9px] font-bold text-ink/50 uppercase tracking-wider">Cost Per Click</p>
            <p className="text-sm font-mono font-bold text-ink">Rp {fIDR(data.overview.cpc)}</p>
          </div>
        </div>
        <div className="bg-ink/[0.02] border border-ink/5 rounded-lg p-2 flex items-center gap-2">
          <div className="p-1.5 bg-white rounded flex-shrink-0 shadow-sm text-purple-500"><Activity size={12}/></div>
          <div>
            <p className="text-[9px] font-bold text-ink/50 uppercase tracking-wider">Click Through Rate</p>
            <p className="text-sm font-mono font-bold text-ink">{data.overview.averageCtr.toFixed(2)}%</p>
          </div>
        </div>
        <div className="bg-ink/[0.02] border border-ink/5 rounded-lg p-2 flex items-center gap-2">
          <div className="p-1.5 bg-white rounded flex-shrink-0 shadow-sm text-indigo-500"><MousePointer size={12}/></div>
          <div>
            <p className="text-[9px] font-bold text-ink/50 uppercase tracking-wider">Total Clicks</p>
            <p className="text-sm font-mono font-bold text-ink">{fIDR(data.overview.totalClicks)}</p>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white border border-ink/10 rounded-2xl p-4 md:p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-ink flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-600" /> Tren Performa Harian ({getTimeLabel()})
              {trendData && trendData.length > 0 && (
                <LandscapeChartPreview title="Tren Performa Harian" subtitle={`Meta Ads — ${getTimeLabel()}`}>
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSpendLs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10, fill: '#64748b' }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#e2e8f0' }} 
                          tickFormatter={(val) => val.split('-').slice(1).join('/')} 
                        />
                        <YAxis 
                          yAxisId="left" 
                          tick={{ fontSize: 10, fill: '#64748b' }} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(val) => Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(val)} 
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          tick={{ fontSize: 10, fill: '#64748b' }} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(val) => Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(val)}
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)', padding: '10px' }}
                          formatter={(value: any, name: any) => {
                            if (name === "spend" || name === "cpa" || name === "cpm") return [`Rp ${new Intl.NumberFormat('id-ID').format(value)}`, name.toUpperCase()];
                            if (name === "roas") return [`${Number(value).toFixed(2)}x`, 'ROAS'];
                            if (name === "ctr") return [`${Number(value).toFixed(2)}%`, 'CTR'];
                            if (name === "conversions") return [value.toLocaleString('id-ID'), 'Pembelian'];
                            if (name === "impressions") return [value.toLocaleString('id-ID'), 'Impressions'];
                            if (name === "clicks") return [value.toLocaleString('id-ID'), 'Clicks'];
                            return [value, name];
                          }}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        {chartStyle === 'line' ? (
                          <>
                            {activeMetrics.spend && <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#f43f5e" strokeWidth={2} fill="url(#colorSpendLs)" name="spend" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />}
                            {activeMetrics.conversions && <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false} name="conversions" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />}
                            {activeMetrics.impressions && <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#0ea5e9" strokeWidth={2} dot={false} name="impressions" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />}
                            {activeMetrics.clicks && <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={false} name="clicks" activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} />}
                            {activeMetrics.roas && <Line yAxisId="right" type="monotone" dataKey="roas" stroke="#14b8a6" strokeWidth={2} dot={false} name="roas" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" isAnimationActive={false} />}
                            {activeMetrics.cpa && <Line yAxisId="left" type="monotone" dataKey="cpa" stroke="#f97316" strokeWidth={2} dot={false} name="cpa" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" isAnimationActive={false} />}
                            {activeMetrics.cpm && <Line yAxisId="left" type="monotone" dataKey="cpm" stroke="#3b82f6" strokeWidth={2} dot={false} name="cpm" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" isAnimationActive={false} />}
                            {activeMetrics.ctr && <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#ec4899" strokeWidth={2} dot={false} name="ctr" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" isAnimationActive={false} />}
                          </>
                        ) : (
                          <>
                            {activeMetrics.spend && <Bar yAxisId="left" dataKey="spend" fill="#f43f5e" name="spend" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                            {activeMetrics.conversions && <Bar yAxisId="right" dataKey="conversions" fill="#10b981" name="conversions" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                            {activeMetrics.impressions && <Bar yAxisId="left" dataKey="impressions" fill="#0ea5e9" name="impressions" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                            {activeMetrics.clicks && <Bar yAxisId="left" dataKey="clicks" fill="#f59e0b" name="clicks" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                            {activeMetrics.roas && <Bar yAxisId="right" dataKey="roas" fill="#14b8a6" name="roas" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                            {activeMetrics.cpa && <Bar yAxisId="left" dataKey="cpa" fill="#f97316" name="cpa" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                            {activeMetrics.cpm && <Bar yAxisId="left" dataKey="cpm" fill="#3b82f6" name="cpm" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                            {activeMetrics.ctr && <Bar yAxisId="right" dataKey="ctr" fill="#ec4899" name="ctr" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={40} />}
                          </>
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </LandscapeChartPreview>
              )}
            </h3>
            
            <div className="flex items-center gap-1 bg-ink/5 p-1 rounded-lg ml-2">
              <button 
                onClick={() => setChartStyle('line')}
                className={cn("p-1.5 rounded transition-all", chartStyle === 'line' ? "bg-white text-blue-600 shadow-sm" : "text-ink/50 hover:text-ink")}
                title="Line Chart"
              >
                <TrendingUp size={14} />
              </button>
              <button 
                onClick={() => setChartStyle('bar')}
                className={cn("p-1.5 rounded transition-all", chartStyle === 'bar' ? "bg-white text-blue-600 shadow-sm" : "text-ink/50 hover:text-ink")}
                title="Bar Chart"
              >
                <BarChart2 size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="text-[11px] border border-ink/10 rounded-md px-2 py-1.5 bg-white text-ink shadow-sm max-w-[200px] md:max-w-xs focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
            >
              <option value="all">Keseluruhan Kampanye</option>
              {data.campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.status !== 'ACTIVE' ? `(${c.status})` : ''}</option>
              ))}
            </select>
            {loadingTrend && <Loader2 size={14} className="animate-spin text-ink/50" />}
          </div>
        </div>

        {/* Custom Legend / Toggles */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button 
            onClick={() => toggleMetric('spend')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.spend ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-rose-500"></span> Spend</button>
          <button 
            onClick={() => toggleMetric('conversions')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.conversions ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-emerald-500"></span> Pembelian</button>
          <button 
            onClick={() => toggleMetric('impressions')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.impressions ? "bg-sky-50 text-sky-700 border-sky-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-sky-500"></span> Impressions</button>
          <button 
            onClick={() => toggleMetric('clicks')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.clicks ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-amber-500"></span> Clicks</button>
          <button 
            onClick={() => toggleMetric('roas')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.roas ? "bg-teal-50 text-teal-700 border-teal-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-teal-500"></span> ROAS</button>
          <button 
            onClick={() => toggleMetric('cpa')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.cpa ? "bg-orange-50 text-orange-700 border-orange-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-orange-500"></span> CPA</button>
          <button 
            onClick={() => toggleMetric('cpm')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.cpm ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-blue-500"></span> CPM</button>
          <button 
            onClick={() => toggleMetric('ctr')}
            className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors border", activeMetrics.ctr ? "bg-pink-50 text-pink-700 border-pink-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10")}
          ><span className="w-2 h-2 rounded-full inline-block mr-1 bg-pink-500"></span> CTR</button>
        </div>

        <div className="h-[280px] w-full">
          {!loadingTrend && trendData && trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')} 
                />
                
                {/* Left Y Axis for large currency/counts (Spend, CPA, CPM, Impressions) */}
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(val)} 
                />
                {/* Right Y Axis for small counts/rates (Conversions, ROAS, CTR) */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(val)}
                />
                
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)', padding: '10px' }}
                  formatter={(value: any, name: any) => {
                    if (name === "spend" || name === "cpa" || name === "cpm") return [`Rp ${fIDR(value)}`, name.toUpperCase()];
                    if (name === "roas") return [`${Number(value).toFixed(2)}x`, 'ROAS'];
                    if (name === "ctr") return [`${Number(value).toFixed(2)}%`, 'CTR'];
                    if (name === "conversions") return [value.toLocaleString('id-ID'), 'Pembelian'];
                    if (name === "impressions") return [value.toLocaleString('id-ID'), 'Impressions'];
                    if (name === "clicks") return [value.toLocaleString('id-ID'), 'Clicks'];
                    return [value, name];
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                
                {chartStyle === 'line' ? (
                  <>
                    {activeMetrics.spend && <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#f43f5e" strokeWidth={2} fill="url(#colorSpend)" name="spend" activeDot={{ r: 5, strokeWidth: 0 }} />}
                    {activeMetrics.conversions && <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false} name="conversions" activeDot={{ r: 5, strokeWidth: 0 }} />}
                    {activeMetrics.impressions && <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#0ea5e9" strokeWidth={2} dot={false} name="impressions" activeDot={{ r: 5, strokeWidth: 0 }} />}
                    {activeMetrics.clicks && <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={false} name="clicks" activeDot={{ r: 5, strokeWidth: 0 }} />}
                    {activeMetrics.roas && <Line yAxisId="right" type="monotone" dataKey="roas" stroke="#14b8a6" strokeWidth={2} dot={false} name="roas" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" />}
                    {activeMetrics.cpa && <Line yAxisId="left" type="monotone" dataKey="cpa" stroke="#f97316" strokeWidth={2} dot={false} name="cpa" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" />}
                    {activeMetrics.cpm && <Line yAxisId="left" type="monotone" dataKey="cpm" stroke="#3b82f6" strokeWidth={2} dot={false} name="cpm" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" />}
                    {activeMetrics.ctr && <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#ec4899" strokeWidth={2} dot={false} name="ctr" activeDot={{ r: 5, strokeWidth: 0 }} strokeDasharray="5 5" />}
                  </>
                ) : (
                  <>
                    {activeMetrics.spend && <Bar yAxisId="left" dataKey="spend" fill="#f43f5e" name="spend" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    {activeMetrics.conversions && <Bar yAxisId="right" dataKey="conversions" fill="#10b981" name="conversions" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    {activeMetrics.impressions && <Bar yAxisId="left" dataKey="impressions" fill="#0ea5e9" name="impressions" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    {activeMetrics.clicks && <Bar yAxisId="left" dataKey="clicks" fill="#f59e0b" name="clicks" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    {activeMetrics.roas && <Bar yAxisId="right" dataKey="roas" fill="#14b8a6" name="roas" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    {activeMetrics.cpa && <Bar yAxisId="left" dataKey="cpa" fill="#f97316" name="cpa" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    {activeMetrics.cpm && <Bar yAxisId="left" dataKey="cpm" fill="#3b82f6" name="cpm" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    {activeMetrics.ctr && <Bar yAxisId="right" dataKey="ctr" fill="#ec4899" name="ctr" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs bg-ink/[0.02] rounded-lg border border-dashed border-ink/10">
               {loadingTrend ? "Memuat data kampanye..." : "Data tren harian belum tersedia"}
             </div>
          )}
        </div>
      </div>

      {/* META ADS MANAGER CLONE TABLE */}
      <MetaAdsTable data={data} timeFilter={timeFilter} />
    </div>
  );
}
