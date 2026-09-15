"use client";

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, AlertTriangle, RefreshCw, Globe, Settings, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoogleAdsData } from '@/actions/googleAds';
import type { GoogleAdsData } from '@/services/google/types';
import { GoogleAdsAnalyticsView } from '../google-views/GoogleAdsAnalyticsView';

export function GoogleAdsTab() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ads' | 'tracking'>('ads');
  const [data, setData] = useState<GoogleAdsData | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('28d');
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());
  
  // Custom Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyCustomDate = () => {
    if (customStart && customEnd) {
      setTimeFilter(`range:${customStart}:${customEnd}`);
      setShowDatePicker(false);
    }
  };

  const loadData = async (filterOverride?: string, modeOverride?: 'ads' | 'tracking') => {
    const filter = filterOverride || timeFilter;
    const mode = modeOverride || viewMode;
    try {
      setLoading(true);
      if (mode === 'ads') {
        const res = await getGoogleAdsData(filter);
        setData(res);
        // Initialize selection with all campaigns if it's the first load or if all were previously selected
        setSelectedCampaignIds(prev => {
           if (prev.size === 0) return new Set(res.campaigns.map(c => c.id));
           // Remove IDs that no longer exist in the new data
           const newSet = new Set(prev);
           newSet.forEach(id => {
             if (!res.campaigns.find(c => c.id === id)) newSet.delete(id);
           });
           return newSet;
        });
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
          Kredensial <strong>Google Ads API</strong> tidak lengkap. Pastikan Anda telah menambahkan \`GOOGLE_ADS_CLIENT_ID\`, \`GOOGLE_ADS_REFRESH_TOKEN\` dan \`GOOGLE_ADS_CUSTOMER_ID\` di environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto minimal-scroll space-y-4 w-full pr-2 pb-24">
      {/* HEADER & FILTER TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-ink/10 pb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold tracking-tight text-ink">
              Google Ads Analytics
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-ink/[0.03] p-1 rounded-lg border border-ink/10">
            <button 
              onClick={() => setViewMode('ads')}
              className={cn("px-3 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1.5", viewMode === 'ads' ? "bg-white shadow-sm text-blue-700" : "text-ink/60 hover:text-ink")}
            >
              <TrendingUp size={12} /> Paid Ads
            </button>
            <button 
              onClick={() => setViewMode('tracking')}
              className={cn("px-3 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1.5", viewMode === 'tracking' ? "bg-white shadow-sm text-purple-700" : "text-ink/60 hover:text-ink")}
            >
              <Settings size={12} /> Tracking
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={pickerRef}>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-white border border-ink/15 text-ink/80 px-3.5 py-2 rounded-lg text-xs font-bold hover:border-ink/30 transition-all shadow-sm active:scale-95"
            >
              <Calendar size={14} className="text-blue-600" />
              {timeFilter.startsWith('range:') 
                ? `${timeFilter.split(':')[1]} - ${timeFilter.split(':')[2]}`
                : (timeFilter === '24h' ? 'Hari Ini' : timeFilter === '7d' ? '7 Hari Terakhir' : timeFilter === '28d' ? '30 Hari Terakhir' : '3 Bulan Terakhir')
              }
            </button>
            
            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-3 bg-white border border-ink/10 rounded-xl shadow-xl z-50 w-64 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col gap-2 mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mb-1">Pilih Cepat</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['24h', '7d', '28d', '90d'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => { setTimeFilter(f); setShowDatePicker(false); }}
                        className={cn(
                          "px-2 py-1.5 rounded text-[11px] font-bold transition-all text-center border",
                          timeFilter === f ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" : "bg-gray-50 text-ink/70 border-transparent hover:bg-gray-100"
                        )}
                      >
                        {f === '24h' ? 'Hari Ini' : f === '7d' ? '7 Hari' : f === '28d' ? '30 Hari' : '3 Bulan'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-ink/5 pt-3">
                  <p className="text-[10px] uppercase tracking-widest text-ink/50 font-bold mb-2">Rentang Kustom</p>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="date" 
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      className="w-full px-2 py-1.5 border border-ink/15 rounded text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <input 
                      type="date" 
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      className="w-full px-2 py-1.5 border border-ink/15 rounded text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={applyCustomDate}
                      disabled={!customStart || !customEnd}
                      className="mt-1 w-full bg-blue-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Terapkan Rentang
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => loadData()} 
            className="bg-white border border-ink/15 text-ink/80 hover:text-ink hover:border-ink/30 px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {viewMode === 'ads' && data && !data.error && data.configured && (
        <GoogleAdsAnalyticsView 
          data={data} 
          timeFilter={timeFilter} 
          selectedCampaignIds={selectedCampaignIds}
          setSelectedCampaignIds={setSelectedCampaignIds}
        />
      )}

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
