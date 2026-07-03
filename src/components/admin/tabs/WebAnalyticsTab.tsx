"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, MousePointerClick, Search, AlertTriangle, AlertCircle, RefreshCw, Eye, Clock, Globe, FileText, Layers, TrendingUp, BarChart2, MapPin, Smartphone, Share2, Flag, Monitor } from 'lucide-react';
import { getWebAnalyticsData, type WebAnalyticsData } from '@/actions/webAnalytics';
import { cn } from '@/lib/utils';

export function WebAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WebAnalyticsData | null>(null);
  const [activeSection, setActiveSection] = useState<'all' | 'ga4' | 'gsc'>('all');
  const [gscTableTab, setGscTableTab] = useState<'queries' | 'pages' | 'countries' | 'devices'>('queries');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getWebAnalyticsData();
      setData(res);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 opacity-70">
        <Activity className="w-10 h-10 animate-pulse text-indigo-600 mb-4" />
        <p className="text-xs uppercase tracking-widest font-bold text-ink/80">Sinkronisasi Data Google Analytics & Search Console...</p>
        <p className="text-[11px] text-ink/50 mt-1">Memuat metrik real-time, demografi wilayah, perangkat, dan performa SEO</p>
      </div>
    );
  }

  if (!data) return null;

  if (!data.configured) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-ink/[0.02] border border-dashed border-ink/20 rounded-xl p-8">
        <AlertTriangle className="w-12 h-12 text-rose mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-tight text-ink mb-2">Web Analytics Belum Dikonfigurasi</h2>
        <p className="text-sm text-ink/70 text-center max-w-lg mb-6">
          Kredensial <strong>Google Service Account</strong> tidak ditemukan di server. Untuk menampilkan grafik pengunjung (GA4) dan data SEO (GSC) di dasbor ini, tambahkan kredensial di <code>.env.local</code> atau Vercel Environment Variables.
        </p>
        <div className="bg-ink/5 p-4 rounded-md w-full max-w-2xl text-left font-mono text-[11px] text-ink/80 space-y-1">
          <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=namarobot@project-id.iam.gserviceaccount.com</p>
          <p>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\nMIIEv...-----END PRIVATE KEY-----\n&quot;</p>
          <p>GA4_PROPERTY_ID=123456789</p>
          <p>GSC_SITE_URL=https://ninoc.store/</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-24">
      {/* HEADER & FILTER TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Website Analytics & SEO Dashboard
            </h1>
          </div>
          <p className="text-xs md:text-sm text-ink/70">
            Pantau trafik real-time, demografi pengunjung, perangkat, sumber akuisisi (GA4), serta peringkat kata kunci organik (GSC).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Section Selector */}
          <div className="bg-ink/5 p-1 rounded-lg flex items-center border border-ink/10 text-xs font-semibold">
            <button
              onClick={() => setActiveSection('all')}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all duration-200",
                activeSection === 'all' ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
              )}
            >
              Semua Overview
            </button>
            <button
              onClick={() => setActiveSection('ga4')}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5",
                activeSection === 'ga4' ? "bg-indigo-600 text-white shadow-sm" : "text-ink/60 hover:text-ink"
              )}
            >
              <Users size={13} /> GA4 Traffic & Demography
            </button>
            <button
              onClick={() => setActiveSection('gsc')}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5",
                activeSection === 'gsc' ? "bg-emerald-600 text-white shadow-sm" : "text-ink/60 hover:text-ink"
              )}
            >
              <Search size={13} /> GSC SEO Performance
            </button>
          </div>

          <button 
            onClick={loadData} 
            className="bg-white border border-ink/15 text-ink/80 hover:text-ink hover:border-ink/30 px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sinkronisasi
          </button>
        </div>
      </div>

      {data.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Peringatan Koneksi API Analytics</p>
            <p className="text-xs text-rose-700 leading-relaxed">{data.error}</p>
            <p className="text-[11px] text-rose-600 font-medium">Beberapa data mungkin tidak tampil maksimal. Pastikan Service Account memiliki akses &apos;Viewer&apos; di Google Analytics dan Google Search Console.</p>
          </div>
        </div>
      )}

      {/* SECTION 1: GOOGLE ANALYTICS 4 */}
      {(activeSection === 'all' || activeSection === 'ga4') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-indigo-700 flex items-center gap-2 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-lg w-fit">
              <Users size={16} /> Google Analytics 4 — Trafik, Demografi Wilayah & Perangkat
            </h2>
            <span className="text-[11px] text-ink/50 font-medium hidden sm:inline-block">GA4 Property ID: {process.env.NEXT_PUBLIC_GA4_ID || '543147964'}</span>
          </div>

          {data.ga4 ? (
            <>
              {/* 5 SUMMARY CARDS FULL WIDTH */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Card 1: Real-time */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 border border-indigo-800 rounded-xl p-4 shadow-md relative overflow-hidden text-white group hover:shadow-lg transition-all duration-200">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Live</span>
                  </div>
                  <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Activity size={14} className="text-indigo-200" /> Real-Time (30 Min)
                  </p>
                  <p className="text-3xl font-mono font-extrabold tracking-tight mt-2">{data.ga4.realtimeVisitors.toLocaleString()}</p>
                  <p className="text-[11px] text-indigo-100/80 mt-2 font-medium leading-tight border-t border-white/10 pt-2">
                    Pengunjung yang sedang aktif menjelajahi web saat ini
                  </p>
                </div>

                {/* Card 2: Visitors */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" /> Pengguna (30 Hari)
                      </p>
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    </div>
                    <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-2">{data.ga4.visitors.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Total pengunjung unik (Unique Users) dalam 30 hari terakhir
                  </p>
                </div>

                {/* Card 3: Pageviews (Amber Color Indicator) */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-amber-300 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Eye size={14} className="text-amber-600 group-hover:scale-110 transition-transform" /> Pageviews
                      </p>
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    </div>
                    <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-2">{data.ga4.pageviews.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Total halaman yang dibuka oleh seluruh pengunjung
                  </p>
                </div>

                {/* Card 4: Sessions */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" /> Total Sesi
                    </p>
                    <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-2">{data.ga4.sessions.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Jumlah kunjungan aktif dari awal buka sampai selesai
                  </p>
                </div>

                {/* Card 5: Duration */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200 group flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div>
                    <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" /> Durasi Rata-rata
                    </p>
                    <p className="text-2xl font-mono font-extrabold text-ink tracking-tight mt-2">{data.ga4.avgSessionDuration}</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Rata-rata durasi waktu pengunjung berada di dalam website
                  </p>
                </div>
              </div>

              {/* GA4 CHART & TOP PAGES GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 2/3 width */}
                <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-600" /> Tren Pengunjung & Pageviews (30 Hari)
                      </h3>
                      <p className="text-xs text-ink/60 mt-0.5">Indikator warna terpisah: Pengunjung (Indigo) vs Pageviews (Amber / Orange)</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-indigo-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span> Pengunjung Aktif
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Pageviews
                      </span>
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.ga4.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                          formatter={(value: any, name: any) => [Number(value).toLocaleString(), name === 'visitors' ? 'Pengunjung Aktif' : 'Pageviews']}
                        />
                        <Area type="monotone" dataKey="visitors" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVis)" name="visitors" />
                        <Area type="monotone" dataKey="pageviews" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" name="pageviews" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Pages 1/3 width */}
                <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-4 border-b border-ink/10 bg-ink/[0.015] flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                        <FileText size={14} className="text-indigo-600" /> Halaman Terpopuler
                      </h3>
                      <p className="text-[11px] text-ink/60 mt-0.5">Top halaman berdasarkan views</p>
                    </div>
                  </div>
                  
                  <div className="overflow-y-auto max-h-[350px] divide-y divide-ink/5">
                    {!data.ga4.topPages || data.ga4.topPages.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink/50">Belum ada data halaman</div>
                    ) : (
                      data.ga4.topPages.map((page, idx) => (
                        <div key={idx} className="p-3 hover:bg-indigo-50/40 transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-ink truncate" title={page.title}>{page.title || page.path}</p>
                            <p className="text-[10px] text-ink/50 font-mono truncate">{page.path}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-mono font-bold text-indigo-700">{page.views.toLocaleString()}</p>
                            <p className="text-[9px] text-ink/50 uppercase">views</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* DEMOGRAPHY, DEVICES & ACQUISITION CHANNELS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Cities / Regions */}
                <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-3.5 border-b border-ink/10 bg-ink/[0.015] flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                      <MapPin size={14} className="text-indigo-600" /> Demografi Wilayah (Kota)
                    </h3>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">GA4 Geo</span>
                  </div>
                  <div className="divide-y divide-ink/5 flex-1 overflow-y-auto max-h-[260px]">
                    {!data.ga4.topCities || data.ga4.topCities.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink/50">Belum ada data demografi wilayah</div>
                    ) : (
                      data.ga4.topCities.map((c, idx) => (
                        <div key={idx} className="p-3 hover:bg-indigo-50/20 transition-colors flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-ink truncate">{c.city}</p>
                              <p className="text-[10px] text-ink/50 uppercase font-mono">{c.country}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-mono font-bold text-indigo-700">{c.users.toLocaleString()} <span className="text-[9px] font-normal text-ink/50">users</span></p>
                            <p className="text-[10px] font-mono text-ink/60">{c.views.toLocaleString()} views</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Device Categories */}
                <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-3.5 border-b border-ink/10 bg-ink/[0.015] flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                      <Smartphone size={14} className="text-indigo-600" /> Kategori Perangkat
                    </h3>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">Devices</span>
                  </div>
                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-center">
                    {!data.ga4.devices || data.ga4.devices.length === 0 ? (
                      <div className="text-center text-xs text-ink/50">Belum ada data perangkat</div>
                    ) : (
                      data.ga4.devices.map((d, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
                              {d.device === 'mobile' ? <Smartphone size={13} className="text-indigo-600" /> : <Monitor size={13} className="text-indigo-600" />}
                              {d.device}
                            </span>
                            <div className="font-mono">
                              <span className="font-bold text-indigo-700">{d.percentage}%</span>
                              <span className="text-[10px] text-ink/50 ml-1.5">({d.users.toLocaleString()} users)</span>
                            </div>
                          </div>
                          <div className="w-full bg-ink/5 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${d.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Acquisition Channels */}
                <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-3.5 border-b border-ink/10 bg-ink/[0.015] flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                      <Share2 size={14} className="text-indigo-600" /> Sumber Akuisisi (Channels)
                    </h3>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">Traffic</span>
                  </div>
                  <div className="divide-y divide-ink/5 flex-1 overflow-y-auto max-h-[260px]">
                    {!data.ga4.channels || data.ga4.channels.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink/50">Belum ada data akuisisi</div>
                    ) : (
                      data.ga4.channels.map((ch, idx) => (
                        <div key={idx} className="p-3 hover:bg-indigo-50/20 transition-colors flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{ch.channel}</p>
                            <p className="text-[10px] text-ink/50">{ch.sessions.toLocaleString()} sesi</p>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <p className="text-xs font-bold text-indigo-700">{ch.users.toLocaleString()}</p>
                            <p className="text-[9px] text-ink/50 uppercase">users</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-rose-50 rounded-xl p-8 text-center border border-dashed border-rose-200">
              <AlertCircle size={24} className="mx-auto mb-2 text-rose-500" />
              <p className="text-sm font-bold uppercase tracking-widest text-rose-600 mb-1">Gagal Memuat Data GA4</p>
              {data.error && <p className="text-xs text-rose-500 max-w-md mx-auto mt-1">{data.error}</p>}
              <button onClick={loadData} className="mt-4 text-xs font-bold uppercase tracking-widest text-rose-600 border border-rose-300 bg-white rounded-lg px-4 py-2 hover:bg-rose-100 transition-colors shadow-sm">Coba Lagi</button>
            </div>
          )}
        </div>
      )}

      {/* DIVIDER if showing all */}
      {activeSection === 'all' && <hr className="border-ink/10 my-8" />}

      {/* SECTION 2: GOOGLE SEARCH CONSOLE */}
      {(activeSection === 'all' || activeSection === 'gsc') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-emerald-700 flex items-center gap-2 bg-emerald-50/80 border border-emerald-100 px-3 py-1.5 rounded-lg w-fit">
              <Search size={16} /> Google Search Console — SEO, Kata Kunci & Negara Pencari
            </h2>
            <span className="text-[11px] text-ink/50 font-medium hidden sm:inline-block">Domain: {process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store/'}</span>
          </div>

          {data.gsc ? (
            <>
              {/* 4 SUMMARY CARDS FULL WIDTH */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Clicks (Emerald Color Indicator) */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <MousePointerClick size={14} className="text-emerald-600 group-hover:scale-110 transition-transform" /> Total Clicks
                      </p>
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    </div>
                    <p className="text-3xl font-mono font-extrabold text-ink tracking-tight mt-1">{data.gsc.clicks.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Total klik dari hasil pencarian organik Google (Organic Traffic)
                  </p>
                </div>

                {/* Impressions (Sky Blue Color Indicator) */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-sky-300 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Eye size={14} className="text-sky-600 group-hover:scale-110 transition-transform" /> Total Impressions
                      </p>
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    </div>
                    <p className="text-3xl font-mono font-extrabold text-ink tracking-tight mt-1">{data.gsc.impressions.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Berapa kali website NINOC muncul di layar pencarian Google
                  </p>
                </div>

                {/* CTR */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-600 group-hover:scale-110 transition-transform" /> CTR Rata-rata
                    </p>
                    <p className="text-3xl font-mono font-extrabold text-emerald-700 tracking-tight mt-1">{data.gsc.ctr.toFixed(2)}%</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Persentase rasio klik dibagi impresi (Click-Through Rate)
                  </p>
                </div>

                {/* Position */}
                <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:border-sky-300 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Globe size={14} className="text-sky-600 group-hover:scale-110 transition-transform" /> Posisi Rata-rata
                    </p>
                    <p className="text-3xl font-mono font-extrabold text-sky-700 tracking-tight mt-1">{data.gsc.position.toFixed(1)}</p>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-3 leading-tight font-medium border-t border-ink/5 pt-2">
                    Peringkat rata-rata di halaman pencarian Google (1 = Paling Atas)
                  </p>
                </div>
              </div>

              {/* GSC CHART & DETAILED TABLES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GSC Chart 2/3 width */}
                <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" /> Tren Performa Google Search Console (30 Hari)
                      </h3>
                      <p className="text-xs text-ink/60 mt-0.5">Indikator warna terpisah: Clicks (Emerald Green) vs Impressions (Sky Blue)</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Clicks
                      </span>
                      <span className="flex items-center gap-1.5 text-sky-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Impressions
                      </span>
                    </div>
                  </div>

                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {data.gsc.trend && data.gsc.trend.length > 0 ? (
                        <AreaChart data={data.gsc.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.35}/>
                              <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                            formatter={(value: any, name: any) => [Number(value).toLocaleString(), name === 'clicks' ? 'Total Clicks' : 'Impressions']}
                          />
                          <Area type="monotone" dataKey="clicks" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" name="clicks" />
                          <Area type="monotone" dataKey="impressions" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorImp)" name="impressions" />
                        </AreaChart>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-ink/50 bg-ink/[0.01] rounded-lg border border-dashed border-ink/10">
                          Grafik tren GSC belum tersedia untuk periode ini
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabbed Table: Queries, Pages, Countries, Devices */}
                <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-3 border-b border-ink/10 bg-ink/[0.015] flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1 bg-ink/5 p-1 rounded-lg text-[11px] font-bold">
                      <button
                        onClick={() => setGscTableTab('queries')}
                        className={cn(
                          "px-2 py-1 rounded transition-all",
                          gscTableTab === 'queries' ? "bg-white text-emerald-700 shadow-sm" : "text-ink/60 hover:text-ink"
                        )}
                      >
                        Kata Kunci
                      </button>
                      <button
                        onClick={() => setGscTableTab('pages')}
                        className={cn(
                          "px-2 py-1 rounded transition-all",
                          gscTableTab === 'pages' ? "bg-white text-emerald-700 shadow-sm" : "text-ink/60 hover:text-ink"
                        )}
                      >
                        Halaman
                      </button>
                      <button
                        onClick={() => setGscTableTab('countries')}
                        className={cn(
                          "px-2 py-1 rounded transition-all",
                          gscTableTab === 'countries' ? "bg-white text-emerald-700 shadow-sm" : "text-ink/60 hover:text-ink"
                        )}
                      >
                        Negara
                      </button>
                      <button
                        onClick={() => setGscTableTab('devices')}
                        className={cn(
                          "px-2 py-1 rounded transition-all",
                          gscTableTab === 'devices' ? "bg-white text-emerald-700 shadow-sm" : "text-ink/60 hover:text-ink"
                        )}
                      >
                        Perangkat
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto flex-1 max-h-[350px]">
                    {gscTableTab === 'queries' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-ink/10 bg-white sticky top-0 z-10">
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider">Top Queries</th>
                            <th className="px-2 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Clicks</th>
                            <th className="px-2 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Impr</th>
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/5">
                          {data.gsc.topQueries.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-ink/50">Belum ada kata kunci terindeks</td></tr>
                          ) : (
                            data.gsc.topQueries.map((q, i) => (
                              <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-3.5 py-2.5 text-xs font-semibold text-ink truncate max-w-[140px]" title={q.query}>{q.query}</td>
                                <td className="px-2 py-2.5 text-xs font-mono text-emerald-600 font-extrabold text-right">{q.clicks.toLocaleString()}</td>
                                <td className="px-2 py-2.5 text-xs font-mono text-ink/60 text-right">{q.impressions.toLocaleString()}</td>
                                <td className="px-3.5 py-2.5 text-xs font-mono text-ink/70 text-right font-medium">{q.ctr !== undefined ? `${q.ctr.toFixed(1)}%` : '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {gscTableTab === 'pages' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-ink/10 bg-white sticky top-0 z-10">
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider">Top Landing URL</th>
                            <th className="px-2 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Clicks</th>
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/5">
                          {!data.gsc.topPages || data.gsc.topPages.length === 0 ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-ink/50">Belum ada halaman terindeks</td></tr>
                          ) : (
                            data.gsc.topPages.map((p, i) => (
                              <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-3.5 py-2.5 text-xs font-semibold text-ink truncate max-w-[170px]" title={p.page}>
                                  <span className="text-emerald-700">{p.page}</span>
                                </td>
                                <td className="px-2 py-2.5 text-xs font-mono text-emerald-600 font-extrabold text-right">{p.clicks.toLocaleString()}</td>
                                <td className="px-3.5 py-2.5 text-xs font-mono text-ink/70 text-right font-medium">{p.ctr.toFixed(1)}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {gscTableTab === 'countries' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-ink/10 bg-white sticky top-0 z-10">
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider">Negara (Country)</th>
                            <th className="px-2 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Clicks</th>
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/5">
                          {!data.gsc.topCountries || data.gsc.topCountries.length === 0 ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-ink/50">Belum ada data negara</td></tr>
                          ) : (
                            data.gsc.topCountries.map((c, i) => (
                              <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-3.5 py-2.5 text-xs font-semibold text-ink flex items-center gap-2">
                                  <Flag size={13} className="text-emerald-600" /> {c.country}
                                </td>
                                <td className="px-2 py-2.5 text-xs font-mono text-emerald-600 font-extrabold text-right">{c.clicks.toLocaleString()}</td>
                                <td className="px-3.5 py-2.5 text-xs font-mono text-ink/70 text-right font-medium">{c.ctr.toFixed(1)}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {gscTableTab === 'devices' && (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-ink/10 bg-white sticky top-0 z-10">
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider">Perangkat</th>
                            <th className="px-2 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Clicks</th>
                            <th className="px-2 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">Impr</th>
                            <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-ink/60 uppercase tracking-wider text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/5">
                          {!data.gsc.devices || data.gsc.devices.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-ink/50">Belum ada data perangkat</td></tr>
                          ) : (
                            data.gsc.devices.map((d, i) => (
                              <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-3.5 py-2.5 text-xs font-semibold text-ink uppercase flex items-center gap-1.5">
                                  {d.device.toLowerCase() === 'mobile' ? <Smartphone size={13} className="text-emerald-600" /> : <Monitor size={13} className="text-emerald-600" />}
                                  {d.device}
                                </td>
                                <td className="px-2 py-2.5 text-xs font-mono text-emerald-600 font-extrabold text-right">{d.clicks.toLocaleString()}</td>
                                <td className="px-2 py-2.5 text-xs font-mono text-ink/60 text-right">{d.impressions.toLocaleString()}</td>
                                <td className="px-3.5 py-2.5 text-xs font-mono text-ink/70 text-right font-medium">{d.ctr.toFixed(1)}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-rose-50 rounded-xl p-8 text-center border border-dashed border-rose-200">
              <AlertCircle size={24} className="mx-auto mb-2 text-rose-500" />
              <p className="text-sm font-bold uppercase tracking-widest text-rose-600 mb-1">Gagal Memuat Data GSC</p>
              {data.error && <p className="text-xs text-rose-500 max-w-md mx-auto mt-1">{data.error}</p>}
              <button onClick={loadData} className="mt-4 text-xs font-bold uppercase tracking-widest text-rose-600 border border-rose-300 bg-white rounded-lg px-4 py-2 hover:bg-rose-100 transition-colors shadow-sm">Coba Lagi</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
