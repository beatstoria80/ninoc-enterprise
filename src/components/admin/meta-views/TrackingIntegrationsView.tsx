"use client";

import React from 'react';
import { Database, Link, CheckCircle2, XCircle, Zap, Copy } from 'lucide-react';
import type { MetaTrackingStatus } from '@/types/metaTracking';

interface TrackingIntegrationsViewProps {
  data: MetaTrackingStatus;
}

export function TrackingIntegrationsView({ data }: TrackingIntegrationsViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* META PIXEL & CAPI STATUS */}
        <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4 pb-4 border-b border-ink/10">
            <Database size={16} className="text-purple-600" />
            Status Koneksi Tracking
          </h3>

          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 rounded-lg bg-ink/[0.02] border border-ink/5">
              <div>
                <p className="text-xs font-bold text-ink flex items-center gap-1.5 mb-1">
                  Meta Pixel <span className="text-[9px] bg-ink/10 px-1.5 py-0.5 rounded font-mono">Client-Side</span>
                </p>
                <p className="text-[11px] text-ink/60">ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-ink/10">{data.pixelId || 'Tidak Diatur'}</code></p>
              </div>
              {data.pixelId ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}
            </div>

            <div className="flex items-start justify-between p-4 rounded-lg bg-ink/[0.02] border border-ink/5">
              <div>
                <p className="text-xs font-bold text-ink flex items-center gap-1.5 mb-1">
                  Conversions API (CAPI) <span className="text-[9px] bg-ink/10 px-1.5 py-0.5 rounded font-mono">Server-Side</span>
                </p>
                <p className="text-[11px] text-ink/60">{data.capiTokenExists ? 'Token Terkonfigurasi' : 'Token Tidak Ditemukan'}</p>
              </div>
              {data.capiTokenExists ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-ink/10">
            <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-3">Supported Standard Events</p>
            <div className="flex flex-wrap gap-2">
              {data.supportedEvents.map(evt => (
                <div key={evt.name} className="flex items-center gap-1.5 bg-white border border-ink/10 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-ink/80 shadow-sm">
                  <Zap size={10} className="text-amber-500" />
                  {evt.name}
                  {evt.serverSide && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Server-Side Active" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PRODUCT CATALOG FEED */}
        <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4 pb-4 border-b border-ink/10">
            <Link size={16} className="text-blue-600" />
            Meta Commerce Catalog Feed
          </h3>
          
          <div className="flex-1 space-y-5">
            <p className="text-xs text-ink/70 leading-relaxed">
              Gunakan URL Feed XML berikut di <strong>Meta Commerce Manager</strong> (Data Sources) untuk melakukan sinkronisasi otomatis produk Anda ke Facebook & Instagram Shop.
            </p>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Feed URL (Real-time XML)</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(data.catalog.feedUrl);
                    alert('URL disalin ke clipboard!');
                  }}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[10px] font-bold bg-white px-2 py-1 rounded shadow-sm border border-blue-200 transition-transform active:scale-95"
                >
                  <Copy size={12} /> Salin URL
                </button>
              </div>
              <code className="block w-full text-[11px] bg-white p-2.5 rounded border border-blue-100 text-blue-900 break-all select-all">
                {data.catalog.feedUrl}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-ink/[0.02] border border-ink/5">
                <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1">Produk Tersinkronisasi</p>
                <p className="text-xl font-mono font-bold text-ink">{data.catalog.totalProductsSynced.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-ink/[0.02] border border-ink/5">
                <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1">Status Generator</p>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 size={14} /> Aktif & Valid
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
