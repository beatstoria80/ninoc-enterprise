"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, RefreshCw, Globe, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoogleAdsData } from '@/actions/googleAds';
import type { GoogleAdsData } from '@/services/google/types';
import { GoogleAdsAnalyticsView } from '../google-views/GoogleAdsAnalyticsView';

export function GoogleAdsTab() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ads' | 'tracking'>('ads');
  const [data, setData] = useState<GoogleAdsData | null>(null);
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '28d' | '90d' | 'all'>('28d');

  const loadData = async (filterOverride?: string, modeOverride?: 'ads' | 'tracking') => {
    const filter = filterOverride || timeFilter;
    const mode = modeOverride || viewMode;
    try {
      setLoading(true);
      if (mode === 'ads') {
        const res = await getGoogleAdsData(filter);
        setData(res);
      }
    } catch (error) {
      console.error('Error fetching Google analytics:', error);
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
        <TrendingUp className="w-10 h-10 animate-pulse text-blue-600 mb-4" />
        <p className="text-xs uppercase tracking-widest font-bold text-ink/80">Sinkronisasi Data Google Ads...</p>
        <p className="text-[11px] text-ink/50 mt-1">Mengambil data metrik terbaru melalui Google Ads API (GAQL)</p>
      </div>
    );
  }

  if (viewMode === 'ads' && data && !data.configured) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-ink/[0.02] border border-dashed border-ink/20 rounded-xl p-8">
        <AlertTriangle className="w-12 h-12 text-rose mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-tight text-ink mb-2">Google Ads Belum Terhubung</h2>
        <p className="text-sm text-ink/70 text-center max-w-lg mb-6">
          Kredensial <strong>Google Ads API</strong> tidak lengkap. Pastikan Anda telah menambahkan \`GOOGLE_ADS_CLIENT_ID\`, \`GOOGLE_ADS_DEVELOPER_TOKEN\`, \`GOOGLE_ADS_REFRESH_TOKEN\` dan \`GOOGLE_ADS_CUSTOMER_ID\` di environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto minimal-scroll space-y-4 w-full pr-2 pb-24">
      {/* HEADER & FILTER TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Google Ads Analytics
            </h1>
          </div>
          <p className="text-xs md:text-sm text-ink/70">
            Pantau performa kampanye Google Search, Display, dan PMax Anda secara real-time.
          </p>
          
          <div className="flex items-center gap-2 mt-4 bg-ink/[0.03] p-1 rounded-lg w-fit border border-ink/10 overflow-x-auto">
            <button 
              onClick={() => setViewMode('ads')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap", viewMode === 'ads' ? "bg-white shadow-sm text-blue-700 scale-100" : "text-ink/60 hover:text-ink hover:bg-ink/5 active:scale-95")}
            >
              <TrendingUp size={14} /> Paid Ads
            </button>
            <button 
              onClick={() => setViewMode('tracking')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap", viewMode === 'tracking' ? "bg-white shadow-sm text-purple-700 scale-100" : "text-ink/60 hover:text-ink hover:bg-ink/5 active:scale-95")}
            >
              <Settings size={14} /> Tracking & Integrations
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
                {f === '24h' ? 'Hari Ini' : f === '7d' ? '7 Hari' : f === '28d' ? '30 Hari' : '3 Bulan'}
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

      {viewMode === 'ads' && data && !data.error && data.configured && <GoogleAdsAnalyticsView data={data} timeFilter={timeFilter} />}

      {viewMode === 'ads' && data && data.error && (
        <div className="flex flex-col items-center justify-center py-20 bg-rose/5 border border-dashed border-rose/20 rounded-xl p-8 mt-4">
           <AlertTriangle className="w-12 h-12 text-rose mb-4" />
           <h2 className="text-xl font-bold uppercase tracking-tight text-ink mb-2">Google Ads API Error</h2>
           <p className="text-sm text-ink/70 text-center max-w-lg mb-4">
             {data.error}
           </p>
           {data.error.includes('permission') && (
             <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-lg w-full mt-2">
               <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">💡 Panduan Penyelesaian:</p>
               <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
                 <li>Pastikan <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">GOOGLE_ADS_LOGIN_CUSTOMER_ID</code> sudah diisi dengan <strong>Manager Account (MCC) ID</strong> Anda.</li>
                 <li>Pastikan <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">GOOGLE_ADS_CUSTOMER_ID</code> adalah ID akun iklan (Client Account), <strong>bukan</strong> ID MCC.</li>
                 <li>Jika menggunakan Vercel, tambahkan kedua variabel di <strong>Vercel Dashboard → Settings → Environment Variables</strong>.</li>
               </ul>
             </div>
           )}
        </div>
      )}

      {viewMode === 'ads' && !data && !loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-rose/5 border border-dashed border-rose/20 rounded-xl p-8 mt-4">
           <AlertTriangle className="w-12 h-12 text-rose mb-4" />
           <h2 className="text-xl font-bold uppercase tracking-tight text-ink mb-2">Gagal Memuat Data</h2>
           <p className="text-sm text-ink/70 text-center max-w-lg mb-6">
             Terjadi kesalahan internal saat menarik data dari server. Silakan refresh halaman atau hubungi Administrator.
           </p>
        </div>
      )}
      
      {viewMode === 'tracking' && (
        <div className="bg-white border border-ink/10 rounded-xl p-8 flex flex-col items-center justify-center opacity-70">
           <Settings className="w-12 h-12 text-ink/30 mb-4" />
           <p className="text-sm font-bold text-ink">Pengaturan Tracking Google (GTM / AW)</p>
           <p className="text-xs text-ink/50 mt-1">Akan hadir pada pembaruan berikutnya.</p>
        </div>
      )}
      
    </div>
  );
}
