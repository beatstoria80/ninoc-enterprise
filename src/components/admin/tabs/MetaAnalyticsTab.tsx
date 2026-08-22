"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, MousePointer, AlertTriangle, AlertCircle, RefreshCw, Eye, TrendingUp, DollarSign, Target, Globe, Instagram, Facebook, Heart, MessageCircle, ImageIcon } from 'lucide-react';
import { getMetaAnalyticsData, getMetaOrganicData, type MetaAnalyticsData, type MetaOrganicData } from '@/actions/metaAnalytics';
import { cn } from '@/lib/utils';

export function MetaAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ads' | 'organic'>('ads');
  const [organicTab, setOrganicTab] = useState<'instagram' | 'facebook'>('instagram');
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
        <p className="text-xs uppercase tracking-widest font-bold text-ink/80">Sinkronisasi Data Meta...</p>
        <p className="text-[11px] text-ink/50 mt-1">Mengambil data metrik terbaru melalui Graph API</p>
      </div>
    );
  }

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
          Kredensial <strong>Meta Page ID</strong> tidak ditemukan. Pastikan Anda telah menambahkan `META_PAGE_ID` di environment variables.
        </p>
      </div>
    );
  }

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const currentPlatformMetrics = organicData ? organicData[organicTab] : null;

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
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5", viewMode === 'ads' ? "bg-white shadow-sm text-blue-700 scale-100" : "text-ink/60 hover:text-ink hover:bg-ink/5 active:scale-95")}
            >
              <Target size={14} /> Paid Ads
            </button>
            <button 
              onClick={() => setViewMode('organic')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5", viewMode === 'organic' ? "bg-white shadow-sm text-emerald-700 scale-100" : "text-ink/60 hover:text-ink hover:bg-ink/5 active:scale-95")}
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

      {/* ==================================================== */}
      {/* SECTION: ADS ANALYTICS                               */}
      {/* ==================================================== */}
      {viewMode === 'ads' && data && (
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
      )}

      {/* ==================================================== */}
      {/* SECTION: ORGANIC ANALYTICS                           */}
      {/* ==================================================== */}
      {viewMode === 'organic' && organicData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          
          {organicData.error && (
            <div className="bg-red-50/80 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-4">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">Sebagian Data Mungkin Tidak Tersedia</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-200 text-red-800 font-bold uppercase tracking-wider">Warning</span>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">{organicData.error.replace(/Data yang ditampilkan adalah simulasi\./gi, '')}</p>
              </div>
            </div>
          )}

          {/* ORGANIC TAB SELECTOR */}
          <div className="flex items-center gap-6 border-b border-ink/10 pb-1">
            <button 
              onClick={() => setOrganicTab('instagram')}
              className={cn("text-sm font-bold pb-3 border-b-2 transition-colors flex items-center gap-2", organicTab === 'instagram' ? "text-pink-600 border-pink-600" : "text-ink/40 border-transparent hover:text-ink/80")}
            >
              <Instagram size={16} className={organicTab === 'instagram' ? "text-pink-500" : ""} /> Instagram
            </button>
            <button 
              onClick={() => setOrganicTab('facebook')}
              className={cn("text-sm font-bold pb-3 border-b-2 transition-colors flex items-center gap-2", organicTab === 'facebook' ? "text-blue-600 border-blue-600" : "text-ink/40 border-transparent hover:text-ink/80")}
            >
              <Facebook size={16} className={organicTab === 'facebook' ? "text-blue-500" : ""} /> Facebook Page
            </button>
          </div>

          {currentPlatformMetrics && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
              
              {/* LEFT COLUMN: KPIs & Chart */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* 4 KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm group">
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users size={12} className={organicTab === 'instagram' ? 'text-pink-500' : 'text-blue-500'} /> Followers
                    </p>
                    <p className="text-2xl font-mono font-extrabold text-ink">{currentPlatformMetrics.followers.toLocaleString()}</p>
                  </div>
                  <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm group">
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Globe size={12} className={organicTab === 'instagram' ? 'text-pink-500' : 'text-blue-500'} /> Reach
                    </p>
                    <p className="text-2xl font-mono font-extrabold text-ink">{currentPlatformMetrics.reach.toLocaleString()}</p>
                  </div>
                  <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm group">
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Activity size={12} className={organicTab === 'instagram' ? 'text-pink-500' : 'text-blue-500'} /> Engagement
                    </p>
                    <p className="text-2xl font-mono font-extrabold text-ink">{currentPlatformMetrics.engagement.toLocaleString()}</p>
                  </div>
                  <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm group">
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Eye size={12} className={organicTab === 'instagram' ? 'text-pink-500' : 'text-blue-500'} /> Profile Views
                    </p>
                    <p className="text-2xl font-mono font-extrabold text-ink">{currentPlatformMetrics.profileViews?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* MAIN TREND CHART */}
                <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className={organicTab === 'instagram' ? 'text-pink-600' : 'text-blue-600'} /> 
                    Pertumbuhan Organik ({getTimeLabel()})
                  </h3>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentPlatformMetrics.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={organicTab === 'instagram' ? '#db2777' : '#2563eb'} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={organicTab === 'instagram' ? '#db2777' : '#2563eb'} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: 'none' }} />
                        <Area type="monotone" dataKey="reach" stroke={organicTab === 'instagram' ? '#db2777' : '#2563eb'} strokeWidth={3} fill="url(#colorReach)" name="Reach" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* TOP POSTS GRID */}
                <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
                    {organicTab === 'instagram' ? <Instagram size={16} className="text-pink-600" /> : <Facebook size={16} className="text-blue-600" />}
                    Konten Teratas
                  </h3>
                  
                  {currentPlatformMetrics.topPosts.length === 0 ? (
                     <div className="py-12 flex flex-col items-center justify-center text-ink/40 bg-ink/[0.015] rounded-lg border border-dashed border-ink/10">
                       <ImageIcon size={24} className="mb-2 opacity-50" />
                       <p className="text-xs font-medium">Belum ada konten untuk periode ini</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {currentPlatformMetrics.topPosts.map(post => (
                        <a key={post.id} href={post.url} target="_blank" rel="noreferrer" className="group block rounded-lg overflow-hidden border border-ink/10 hover:border-ink/30 transition-colors">
                          <div className="aspect-square bg-ink/5 relative overflow-hidden">
                            {post.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={post.thumbnail} alt={post.caption || "Thumbnail konten"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink/20"><ImageIcon size={24} /></div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-widest shadow-sm">
                              {post.type}
                            </div>
                            {/* Hover Overlay with Stats */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4">
                               <div className="flex flex-col items-center text-white">
                                 <Heart size={18} className="mb-1 fill-white" />
                                 <span className="text-xs font-bold font-mono">{post.likes}</span>
                               </div>
                               <div className="flex flex-col items-center text-white">
                                 <MessageCircle size={18} className="mb-1 fill-white" />
                                 <span className="text-xs font-bold font-mono">{post.comments}</span>
                               </div>
                            </div>
                          </div>
                          <div className="p-2.5 bg-white">
                            <p className="text-[10px] text-ink/50 mb-1">{post.date}</p>
                            <p className="text-xs text-ink/80 line-clamp-2 leading-tight">{post.caption || 'Tanpa deskripsi'}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Demographics */}
              <div className="space-y-6">
                <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
                    <Users size={16} className={organicTab === 'instagram' ? 'text-pink-600' : 'text-blue-600'} />
                    Demografi Audiens (Lifetime)
                  </h3>

                  {!currentPlatformMetrics.demographics || currentPlatformMetrics.demographics.ageGender.length === 0 ? (
                     <div className="py-8 flex flex-col items-center justify-center text-center px-4 bg-ink/[0.015] rounded-lg border border-dashed border-ink/10">
                       <AlertCircle size={24} className="text-ink/30 mb-2" />
                       <p className="text-xs font-medium text-ink/60">Data demografi belum tersedia.</p>
                       <p className="text-[10px] text-ink/40 mt-1">Akun minimal butuh 100 followers untuk membuka fitur demografi dari Meta API.</p>
                     </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Age & Gender */}
                      <div>
                        <p className="text-[10px] font-bold text-ink/50 uppercase mb-3 tracking-wider">Umur & Jenis Kelamin (Top 5)</p>
                        <div className="space-y-3">
                          {currentPlatformMetrics.demographics.ageGender.map((seg, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs">
                              <span className="font-semibold text-ink/80 w-24 truncate">{seg.segment}</span>
                              <div className="flex-1 bg-ink/5 h-2 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", organicTab === 'instagram' ? 'bg-pink-500' : 'bg-blue-500')} style={{ width: `${Math.max(seg.percentage, 2)}%` }}></div>
                              </div>
                              <span className="font-mono text-ink/60 w-10 text-right">{seg.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Top Locations */}
                      <div className="pt-4 border-t border-ink/10">
                        <p className="text-[10px] font-bold text-ink/50 uppercase mb-3 tracking-wider">Kota Teratas</p>
                        <div className="space-y-2.5">
                          {currentPlatformMetrics.demographics.topLocations.map((loc, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-ink/70 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-ink/20"></span> {loc.city}
                              </span>
                              <span className="font-mono font-bold text-ink">{loc.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
