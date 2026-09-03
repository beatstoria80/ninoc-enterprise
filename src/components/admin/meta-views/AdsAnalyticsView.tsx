"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Target, MousePointer, Eye, TrendingUp, AlertCircle, ShoppingCart, Activity, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import type { MetaAnalyticsData } from '@/actions/metaAnalytics';
import { cn } from '@/lib/utils';

interface AdsAnalyticsViewProps {
  data: MetaAnalyticsData;
  timeFilter: string;
}

export function AdsAnalyticsView({ data, timeFilter }: AdsAnalyticsViewProps) {
  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      // Escape name quotes and commas just in case
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
        <h3 className="text-xs font-bold text-ink flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-blue-600" /> Tren Performa Harian ({getTimeLabel()})
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
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
                tickFormatter={(val) => `Rp${Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(val)}`} 
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
                  if (name === "Ad Spend (Rp)" && typeof value === 'number') return [`Rp ${fIDR(value)}`, name];
                  return [value, name];
                }}
              />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="spend" 
                stroke="#f43f5e" 
                strokeWidth={2} 
                fill="url(#colorSpend)" 
                name="Ad Spend (Rp)" 
                dot={data.trend.length === 1 ? { r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" } : false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="conversions" 
                stroke="#10b981" 
                strokeWidth={2} 
                fill="url(#colorConv)" 
                name="Conversions" 
                dot={data.trend.length === 1 ? { r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" } : false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* META ADS MANAGER CLONE TABLE */}
      {data.campaigns.length > 0 && (
        <div className="bg-white border border-ink/10 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          
          {/* Table Toolbar / Tab Header */}
          <div className="p-3 border-b border-ink/10 bg-ink/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="bg-white border border-ink/10 shadow-sm px-3 py-1.5 rounded text-[11px] font-bold text-ink flex items-center gap-1.5 hover:bg-ink/[0.02]">
                <Target size={14} className="text-blue-600" /> Kampanye <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-[9px] ml-1">{data.campaigns.length} Dipilih</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
              <thead>
                <tr className="bg-white border-b border-ink/10">
                  {/* Sticky Left Column */}
                  <th className="sticky left-0 bg-white z-10 px-3 py-2 border-r border-ink/10 min-w-[250px] max-w-[300px]">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-ink/20 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" defaultChecked />
                      <div className="flex-1 text-[10px] font-semibold text-ink/70 flex items-center gap-1">Nama Kampanye <ArrowDownRight size={10} className="text-ink/40" /></div>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px]">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1 text-blue-600 cursor-pointer hover:underline">Penayangan <ArrowDownRight size={10} /></span>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[80px]">Tindakan</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[100px] text-right">Hasil <ArrowDownRight size={10} className="inline opacity-50" /></th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px] text-right">Biaya per hasil <ArrowDownRight size={10} className="inline opacity-50" /></th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[150px]">Anggaran <ArrowDownRight size={10} className="inline opacity-50" /></th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[130px] text-right">Jumlah dibelanjakan <ArrowDownRight size={10} className="inline opacity-50" /></th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[100px] text-right">Impresi <ArrowDownRight size={10} className="inline opacity-50" /></th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[100px] text-right">Jangkauan <ArrowDownRight size={10} className="inline opacity-50" /></th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px]">Berakhir <ArrowDownRight size={10} className="inline opacity-50" /></th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px] text-center">Peringkat Kualitas</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px] text-center">Peringkat Interaksi</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px] text-center">Peringkat Konversi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.campaigns.sort((a, b) => b.spend - a.spend).map((camp) => (
                  <tr key={camp.id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* Sticky Name Column */}
                    <td className="sticky left-0 bg-white group-hover:bg-[#f8fafc] z-10 px-3 py-2.5 border-r border-ink/5 flex items-center gap-3">
                      <input type="checkbox" className="rounded border-ink/20 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" defaultChecked />
                      
                      {/* Toggle Switch Replica */}
                      <button className={cn(
                        "w-7 h-4 rounded-full relative transition-colors shadow-inner flex-shrink-0",
                        camp.status === 'ACTIVE' ? "bg-blue-500" : "bg-ink/20"
                      )}>
                        <span className={cn(
                          "absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow transition-transform",
                          camp.status === 'ACTIVE' ? "translate-x-3" : "translate-x-0"
                        )} />
                      </button>

                      <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer truncate" title={camp.name}>{camp.name}</p>
                        <p className="text-[9px] text-ink/40 mt-0.5 truncate flex items-center gap-1">
                          <Eye size={9} /> ID: {camp.id}
                        </p>
                      </div>
                    </td>

                    {/* Delivery Status */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          camp.deliveryStatus === 'ACTIVE' ? "bg-emerald-500" :
                          camp.deliveryStatus === 'PAUSED' ? "bg-ink/30" :
                          "bg-rose-500"
                        )} />
                        <span className="text-[11px] font-medium text-ink/80 capitalize">
                          {camp.deliveryStatus.toLowerCase()}
                        </span>
                      </div>
                    </td>

                    {/* Tindakan */}
                    <td className="px-3 py-2.5 text-[11px] text-ink/40 text-center">—</td>

                    {/* Hasil (Conversions) */}
                    <td className="px-3 py-2.5 text-right">
                      <p className="text-[11px] font-semibold text-ink">{camp.conversions}</p>
                      {camp.conversions > 0 && <p className="text-[8px] text-ink/50 mt-0.5">Pembelian</p>}
                    </td>

                    {/* Cost Per Result */}
                    <td className="px-3 py-2.5 text-right">
                      {camp.cpa > 0 ? (
                        <>
                          <p className="text-[11px] font-mono font-medium text-ink">Rp {fIDR(camp.cpa)}</p>
                          <p className="text-[8px] text-ink/50 mt-0.5">Per Pembelian</p>
                        </>
                      ) : (
                        <span className="text-[11px] text-ink/40">—</span>
                      )}
                    </td>

                    {/* Budget */}
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] text-ink/80 max-w-[140px] truncate" title={camp.budget}>{camp.budget}</p>
                    </td>

                    {/* Amount Spent */}
                    <td className="px-3 py-2.5 text-right">
                      <p className="text-[11px] font-mono font-medium text-ink">Rp {fIDR(camp.spend)}</p>
                    </td>

                    {/* Impressions */}
                    <td className="px-3 py-2.5 text-right">
                      <p className="text-[11px] font-mono text-ink">{camp.impressions.toLocaleString('id-ID')}</p>
                    </td>

                    {/* Reach */}
                    <td className="px-3 py-2.5 text-right">
                      <p className="text-[11px] font-mono text-ink">{camp.reach > 0 ? camp.reach.toLocaleString('id-ID') : '—'}</p>
                    </td>

                    {/* Ends */}
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] text-ink/80">{camp.endDate}</p>
                    </td>

                    {/* Quality Ranking */}
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[11px] text-ink/60">{camp.qualityRanking}</span>
                    </td>

                    {/* Engagement Rate Ranking */}
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[11px] text-ink/60">{camp.engagementRanking}</span>
                    </td>

                    {/* Conversion Rate Ranking */}
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[11px] text-ink/60">{camp.conversionRanking}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="px-4 py-2 bg-ink/[0.01] border-t border-ink/5 flex items-center justify-between text-[10px] text-ink/50 font-medium">
            <p>Hasil dari {data.campaigns.length} kampanye</p>
          </div>
        </div>
      )}
    </div>
  );
}
