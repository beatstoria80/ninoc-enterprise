"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, MousePointerClick, Search, Target, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { getWebAnalyticsData, type WebAnalyticsData } from '@/actions/webAnalytics';
import { cn } from '@/lib/utils';

export function WebAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WebAnalyticsData | null>(null);

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
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <Activity className="w-8 h-8 animate-pulse text-ink mb-4" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-ink">Mengambil Data Google Analytics & Search Console...</p>
      </div>
    );
  }

  if (!data) return null;

  if (!data.configured) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-12 h-12 text-rose mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-tight text-ink mb-2">Web Analytics Belum Dikonfigurasi</h2>
        <p className="text-sm text-ink/70 text-center max-w-lg mb-6">
          Kredensial <strong>Google Service Account</strong> tidak ditemukan di server. Untuk menampilkan grafik pengunjung (GA4) dan data SEO (GSC) di dasbor ini, tambahkan kredensial di <code>.env.local</code>.
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
    <div className="space-y-6 w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-ink flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Website Analytics (GA4 & GSC)
          </h1>
          <p className="text-xs md:text-sm text-ink/80 mt-1">
            Data pengunjung real-time dari Google Analytics 4 dan Google Search Console (30 Hari Terakhir).
          </p>
        </div>
        <button onClick={loadData} className="bg-white border border-ink/10 text-ink/80 hover:text-ink px-3 py-1.5 rounded-sm flex items-center gap-2 text-xs font-medium uppercase tracking-widest transition-colors shadow-sm w-fit">
          <RefreshCw size={14} /> Sinkronisasi
        </button>
      </div>

      {data.error && (
        <div className="bg-rose/10 border border-rose/30 text-rose p-3 rounded-md flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5" />
          <div>
            <p className="text-sm font-bold">Terjadi kesalahan koneksi API</p>
            <p className="text-xs mt-0.5">{data.error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GA4 SECTION */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-2">
            <Users size={16} /> Google Analytics 4
          </h2>
          
          {data.ga4 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-indigo-600 border border-indigo-700 rounded-md p-3 shadow-md relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1">Real-Time (30 Min)</p>
                  <p className="text-2xl font-mono font-bold text-white">{data.ga4.realtimeVisitors.toLocaleString()}</p>
                  <p className="text-[9px] text-white/50 mt-1 leading-tight">Pengunjung aktif di web saat ini (30 menit terakhir)</p>
                </div>
                <div className="bg-white border border-indigo-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Pengguna (30 Hari)</p>
                  <p className="text-xl font-mono font-bold text-indigo-700">{data.ga4.visitors.toLocaleString()}</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Total pengunjung unik dalam 30 hari terakhir</p>
                </div>
                <div className="bg-white border border-indigo-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Pageviews</p>
                  <p className="text-xl font-mono font-bold text-indigo-700">{data.ga4.pageviews.toLocaleString()}</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Total halaman yang dibuka oleh seluruh pengunjung</p>
                </div>
                <div className="bg-white border border-indigo-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Total Sesi</p>
                  <p className="text-xl font-mono font-bold text-indigo-700">{data.ga4.sessions.toLocaleString()}</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Jumlah kunjungan aktif ke website</p>
                </div>
                <div className="bg-white border border-indigo-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Durasi Rata-rata</p>
                  <p className="text-xl font-mono font-bold text-indigo-700">{data.ga4.avgSessionDuration}</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Rata-rata waktu pengunjung menelusuri web</p>
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-md p-4 shadow-sm h-[300px]">
                <p className="text-xs font-semibold text-ink/60 uppercase tracking-widest mb-4">Tren Pengunjung (30 Hari)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.ga4.trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4338ca" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4338ca" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                    <YAxis tick={{ fontSize: 10, fill: '#666' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '4px', fontSize: '12px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#333' }}
                    />
                    <Area type="monotone" dataKey="visitors" stroke="#4338ca" strokeWidth={2} fillOpacity={1} fill="url(#colorVis)" name="Pengunjung Aktif" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-ink/5 rounded-md p-6 text-center border border-dashed border-ink/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">GA4_PROPERTY_ID Belum Disetel</p>
            </div>
          )}
        </div>

        {/* GSC SECTION */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-2">
            <Search size={16} /> Google Search Console
          </h2>
          
          {data.gsc ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-emerald-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Total Clicks</p>
                  <p className="text-xl font-mono font-bold text-emerald-700">{data.gsc.clicks.toLocaleString()}</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Klik dari hasil pencarian Google</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Impressions</p>
                  <p className="text-xl font-mono font-bold text-emerald-700">{data.gsc.impressions.toLocaleString()}</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Berapa kali web muncul di pencarian Google</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">CTR Rata-rata</p>
                  <p className="text-xl font-mono font-bold text-emerald-700">{data.gsc.ctr.toFixed(2)}%</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Rasio klik setelah melihat link Anda</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mb-1">Posisi Rata-rata</p>
                  <p className="text-xl font-mono font-bold text-emerald-700">{data.gsc.position.toFixed(1)}</p>
                  <p className="text-[9px] text-ink/40 mt-1 leading-tight">Peringkat rata-rata di Google (1 = paling atas)</p>
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-md overflow-hidden shadow-sm">
                <div className="p-3 border-b border-ink/10 bg-ink/[0.015]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ink/70">Top Search Queries (30 Hari)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-ink/10 bg-white">
                        <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider">Kata Kunci (Query)</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-right">Clicks</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-ink/60 uppercase tracking-wider text-right">Impressions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {data.gsc.topQueries.length === 0 ? (
                        <tr><td colSpan={3} className="px-3 py-6 text-center text-xs text-ink/50">Tidak ada data pencarian yang cukup</td></tr>
                      ) : (
                        data.gsc.topQueries.map((q, i) => (
                          <tr key={i} className="hover:bg-ink/[0.01]">
                            <td className="px-3 py-2 text-xs font-semibold text-ink">{q.query}</td>
                            <td className="px-3 py-2 text-xs font-mono text-emerald-600 font-bold text-right">{q.clicks.toLocaleString()}</td>
                            <td className="px-3 py-2 text-xs font-mono text-ink/60 text-right">{q.impressions.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
             <div className="bg-ink/5 rounded-md p-6 text-center border border-dashed border-ink/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">GSC_SITE_URL Belum Disetel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
