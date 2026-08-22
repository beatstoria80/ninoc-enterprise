"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, MousePointer, Search, AlertTriangle, AlertCircle, RefreshCw, Eye, TrendingUp, DollarSign, Target, Globe, MonitorSmartphone } from 'lucide-react';
import { getMetaAnalyticsData, getMetaOrganicData, type MetaAnalyticsData, type MetaOrganicData } from '@/actions/metaAnalytics';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function MetaAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ads' | 'organic'>('ads');
  const [data, setData] = useState<MetaAnalyticsData | null>(null);
  const [organicData, setOrganicData] = useState<MetaOrganicData | null>(null);
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '28d' | '90d' | 'all'>('28d');

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

  const loadData = async (filterOverride?: string, modeOverride?: 'ads' | 'organic') => {
    const filter = filterOverride || timeFilter;
    const mode = modeOverride || viewMode;
    try {
      setLoading(true);
      if (mode === 'ads') {
        const res = await getMetaAnalyticsData(filter);
        setData(res);
      } else {
        const orgRes = await getMetaOrganicData(filter);
        setOrganicData(orgRes);
      }
    } catch (error) {
      console.error('Error fetching Meta analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(timeFilter, viewMode);
  }, [timeFilter, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 opacity-70">
        <Activity className="w-10 h-10 animate-pulse text-blue-600 mb-4" />
        <p className="text-xs uppercase tracking-widest font-bold text-ink/80">Sinkronisasi Data Meta Ads...</p>
        <p className="text-[11px] text-ink/50 mt-1">Mengambil data dari Facebook Graph API</p>
      </div>
    );
  }

  if (viewMode === 'ads' && !data) return null;
  if (viewMode === 'organic' && !organicData) return null;

  if (viewMode === 'ads' && data && !data.configured) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-ink/[0.02] border border-dashed border-ink/20 rounded-xl p-8">
        <AlertTriangle className="w-12 h-12 text-rose mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-tight text-ink mb-2">Meta Ads Belum Terhubung</h2>
        <p className="text-sm text-ink/70 text-center max-w-lg mb-6">
          Kredensial <strong>Meta CAPI Token</strong> tidak ditemukan. Pastikan Anda telah menambahkan `META_CAPI_TOKEN` dan `META_AD_ACCOUNT_ID` di environment variables.
        </p>
      </div>
    );
  }

  if (viewMode === 'organic' && organicData && !organicData.configured) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-ink/[0.02] border border-dashed border-ink/20 rounded-xl p-8">
        <AlertTriangle className="w-12 h-12 text-rose mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-tight text-ink mb-2">Data Organik Belum Terhubung</h2>
        <p className="text-sm text-ink/70 text-center max-w-lg mb-6">
          Kredensial <strong>Meta Page ID</strong> tidak ditemukan. Pastikan Anda telah menambahkan `META_PAGE_ID` di environment variables, dan token Anda memiliki izin <code>pages_read_engagement</code>.
        </p>
      </div>
    );
  }

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="flex-1 overflow-y-auto minimal-scroll space-y-8 w-full pr-2 pb-24">
      {/* HEADER & FILTER TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Meta Social & Ads Analytics
            </h1>
          </div>
          <p className="text-xs md:text-sm text-ink/70">
            Pantau performa kampanye Ads Berbayar dan pertumbuhan Organik (Facebook & Instagram).
          </p>
          
          <div className="flex items-center gap-2 mt-4 bg-ink/[0.03] p-1 rounded-lg w-fit border border-ink/10">
            <button 
              onClick={() => setViewMode('ads')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5", viewMode === 'ads' ? "bg-white shadow-sm text-blue-700" : "text-ink/60 hover:text-ink")}
            >
              <Target size={14} /> Paid Ads
            </button>
            <button 
              onClick={() => setViewMode('organic')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5", viewMode === 'organic' ? "bg-white shadow-sm text-emerald-700" : "text-ink/60 hover:text-ink")}
            >
              <Users size={14} /> Organic Social
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-blue-50/50 border border-blue-100 p-1.5 rounded-lg">
            {(['24h', '7d', '28d', '90d'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  timeFilter === f ? "bg-blue-600 text-white shadow-sm" : "text-blue-900/60 hover:text-blue-900 hover:bg-blue-100/50"
                )}
              >
                {f === '24h' ? '24 Jam' : f === '7d' ? '7 Hari' : f === '28d' ? '28 Hari' : '3 Bulan'}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => loadData()} 
            className="bg-white border border-ink/15 text-ink/80 hover:text-ink hover:border-ink/30 px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {viewMode === 'ads' && data?.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Data Iklan Tidak Tersedia</p>
            <p className="text-xs text-red-700 leading-relaxed">{data.error.replace(/Menampilkan data simulasi\./gi, '')}</p>
          </div>
        </div>
      )}

      {viewMode === 'organic' && organicData?.error && (
        <div className="bg-red-50/80 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">Data Organik Tidak Tersedia</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-200 text-red-800 font-bold uppercase tracking-wider">Error Konfigurasi</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">{organicData.error.replace(/Data yang ditampilkan adalah simulasi\./gi, '')}</p>
          </div>
        </div>
      )}

      {viewMode === 'ads' && data && (
        <React.Fragment>
          {/* KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Spend */}
        <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all group flex flex-col justify-between">
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
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-700 rounded-xl p-4 shadow-sm text-white group flex flex-col justify-between">
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
        <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all group flex flex-col justify-between">
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
        <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all group flex flex-col justify-between">
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

      {/* TREND CHART & CAMPAIGNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
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
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#f43f5e" strokeWidth={2} fill="url(#colorSpend)" name="Ad Spend (Rp)" />
                <Area yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} fill="url(#colorConv)" name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-white border border-ink/10 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-ink/10 bg-ink/[0.015]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
              <Users size={14} className="text-blue-600" /> Demografi Audiens
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-ink/50 uppercase mb-2">Umur & Jenis Kelamin</p>
              <div className="space-y-2">
                {data.demographics.ageGender.map((seg: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold w-16 truncate">{seg.segment}</span>
                    <div className="flex-1 bg-ink/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${seg.percentage}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-ink/70 w-8 text-right">{seg.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-ink/10">
              <p className="text-[10px] font-bold text-ink/50 uppercase mb-2">Lokasi Teratas</p>
              <div className="flex flex-wrap gap-1.5">
                {data.demographics.topLocations.map((loc, i) => (
                  <span key={i} className="bg-ink/5 px-2 py-1 rounded text-[10px] font-medium text-ink">
                    {loc.city} <span className="font-mono text-ink/50 ml-1">{loc.percentage}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CAMPAIGN LIST */}
      <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-ink/10 flex items-center justify-between bg-ink/[0.015]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
            <Activity size={14} className="text-blue-600" /> Performa Kampanye Iklan
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/10 bg-white">
                <th className="px-4 py-3 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider">Kampanye</th>
                <th className="px-4 py-3 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Spend</th>
                <th className="px-4 py-3 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Clicks</th>
                <th className="px-4 py-3 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Conv.</th>
                <th className="px-4 py-3 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.campaigns.map((c: any) => (
                <tr key={c.id} className="hover:bg-ink/[0.01] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-ink">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase",
                        c.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/60"
                      )}>{c.status}</span>
                      <span className="text-[10px] text-ink/40 font-mono">ID: {c.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-xs font-mono font-bold text-rose-600">Rp {fIDR(c.spend)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-xs font-mono font-bold text-ink">{c.clicks.toLocaleString()}</p>
                    <p className="text-[10px] text-ink/50">CTR {(c.clicks/c.impressions*100).toFixed(1)}%</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-xs font-mono font-bold text-emerald-600">{c.conversions}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-xs font-mono font-bold",
                      c.roas >= 3 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                    )}>
                      {c.roas.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </React.Fragment>
      )}

      {viewMode === 'organic' && organicData && (
        <React.Fragment>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Followers */}
            <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-500" /> Followers
                  </p>
                </div>
                <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">{organicData.followers.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-ink/60 mt-2 font-medium border-t border-ink/5 pt-1.5">
                Total Pengikut Halaman & IG
              </p>
            </div>

            {/* Reach */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-700 rounded-xl p-4 shadow-sm text-white group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={14} className="text-indigo-200" /> Organic Reach
                  </p>
                </div>
                <p className="text-3xl font-mono font-extrabold tracking-tight mt-1">{organicData.reach.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-indigo-100 mt-2 font-medium border-t border-indigo-400/30 pt-1.5">
                Jangkauan akun dalam {getTimeLabel()}
              </p>
            </div>

            {/* Engagement */}
            <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-rose-500" /> Engagements
                  </p>
                </div>
                <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">{organicData.engagement.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-ink/60 mt-2 font-medium border-t border-ink/5 pt-1.5">
                Likes, comments, shares, saves
              </p>
            </div>

            {/* Profile Views */}
            <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye size={14} className="text-blue-500" /> Profile Views
                  </p>
                </div>
                <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-1">{organicData.profileViews.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-ink/60 mt-2 font-medium border-t border-ink/5 pt-1.5">
                Kunjungan profil sosial media
              </p>
            </div>
          </div>

          {/* Organic Trend Chart */}
          <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-600" /> Tren Jangkauan Organik ({getTimeLabel()})
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={organicData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="reach" stroke="#6366f1" strokeWidth={2} fill="url(#colorReach)" name="Organic Reach" />
                  <Area yAxisId="right" type="monotone" dataKey="engagement" stroke="#f43f5e" strokeWidth={2} fill="url(#colorEngagement)" name="Engagement" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
