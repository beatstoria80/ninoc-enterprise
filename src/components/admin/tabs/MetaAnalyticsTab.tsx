"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Users, AlertTriangle, RefreshCw, Target, Globe, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetaAnalyticsData, MetaOrganicData } from '@/services/meta/types';
import { type MetaTrackingStatus } from '@/types/metaTracking';
import { AdsAnalyticsView } from '../meta-views/AdsAnalyticsView';
import { OrganicAnalyticsView } from '../meta-views/OrganicAnalyticsView';
import { TrackingIntegrationsView } from '../meta-views/TrackingIntegrationsView';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

export function MetaAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'ads' | 'organic' | 'tracking'>('ads');
  const [data, setData] = useState<MetaAnalyticsData | null>(null);
  const [organicData, setOrganicData] = useState<MetaOrganicData | null>(null);
  const [trackingData, setTrackingData] = useState<MetaTrackingStatus | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('28d');

  const loadData = async (filterOverride?: string, modeOverride?: 'ads' | 'organic' | 'tracking') => {
    const filter = filterOverride || timeFilter;
    const mode = modeOverride || viewMode;
    try {
      setLoading(true);
      if (mode === 'ads') {
        const response = await fetch(`/api/admin/meta-ads?filter=${filter}`, { cache: 'no-store' });
        const res = await response.json();
        if (res.success) setData(res.data);
      } else if (mode === 'organic') {
        const response = await fetch(`/api/admin/meta-organic?filter=${filter}`, { cache: 'no-store' });
        const res = await response.json();
        if (res.success) setOrganicData(res.data);
      } else if (mode === 'tracking') {
        const response = await fetch(`/api/admin/meta-tracking`, { cache: 'no-store' });
        const res = await response.json();
        if (res.success) setTrackingData(res.data);
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

  return (
    <div className="flex-1 overflow-y-auto minimal-scroll space-y-4 w-full md:pr-2 pb-24">
      {/* HEADER & FILTER TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ink/10 pb-4 mt-4 md:mt-0">
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
          
          <div className="flex items-center gap-2 mt-4 bg-ink/[0.03] p-1 rounded-lg w-full md:w-fit border border-ink/10 overflow-x-auto minimal-scroll">
            <button 
              onClick={() => setViewMode('ads')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0", viewMode === 'ads' ? "bg-white shadow-sm text-blue-700 scale-100" : "text-ink/60 hover:text-ink hover:bg-ink/5 active:scale-95")}
            >
              <Target size={14} /> Paid Ads
            </button>
            <button 
              onClick={() => setViewMode('organic')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0", viewMode === 'organic' ? "bg-white shadow-sm text-emerald-700 scale-100" : "text-ink/60 hover:text-ink hover:bg-ink/5 active:scale-95")}
            >
              <Users size={14} /> Organic Social
            </button>
            <button 
              onClick={() => setViewMode('tracking')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0", viewMode === 'tracking' ? "bg-white shadow-sm text-purple-700 scale-100" : "text-ink/60 hover:text-ink hover:bg-ink/5 active:scale-95")}
            >
              <Settings size={14} /> Tracking & Integrations
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker value={timeFilter} onChange={setTimeFilter} />
          
          <button 
            onClick={() => loadData()} 
            className="bg-white border border-ink/15 text-ink/80 hover:text-ink hover:border-ink/30 px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex-1 md:flex-none justify-center"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {viewMode === 'ads' && data && <AdsAnalyticsView data={data} timeFilter={timeFilter} />}
      {viewMode === 'organic' && organicData && <OrganicAnalyticsView data={organicData} timeFilter={timeFilter} />}
      {viewMode === 'tracking' && trackingData && <TrackingIntegrationsView data={trackingData} />}
      
    </div>
  );
}
