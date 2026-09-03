"use client";

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Play, Clock, Search, Target, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getGoogleAdDetail } from '@/actions/googleAds';
import type { GoogleAdInsightsDetail } from '@/services/google/types';
import { cn } from '@/lib/utils';

export function GoogleAdInsightsDetailPane({ adId, onClose }: { adId: string; onClose: () => void }) {
  const [data, setData] = useState<GoogleAdInsightsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getGoogleAdDetail(adId).then(res => {
      if (active) {
        setData(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [adId]);

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-slate-50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-ink/10">
        <div className="p-4 border-b border-ink/10 bg-white flex items-center justify-between">
          <div className="w-48 h-6 bg-ink/5 rounded animate-pulse" />
          <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full text-ink/60 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 flex-1 flex flex-col gap-4">
          <div className="w-full h-32 bg-ink/5 rounded-xl animate-pulse" />
          <div className="w-full h-64 bg-ink/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-slate-50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-ink/10">
        <div className="p-4 border-b border-ink/10 bg-white flex items-center justify-between">
          <h2 className="font-bold text-ink">Error</h2>
          <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full text-ink/60 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">Gagal memuat detail wawasan Google Ads.</div>
      </div>
    );
  }

  const fIDR = (num: any) => {
    const validNum = Number(num);
    if (isNaN(validNum) || validNum == null) return '0';
    return validNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[800px] bg-[#f0f2f5] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-ink/10">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-ink/10 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full text-ink/60 transition-colors -ml-2"><X size={20} /></button>
          <div className="w-10 h-10 bg-ink/5 rounded-md overflow-hidden flex items-center justify-center border border-ink/10 shrink-0">
            <Search size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink line-clamp-1">{data.name}</h2>
            <p className="text-[10px] text-ink/50 mt-0.5">Google Ads • Dipublikasikan pada: {data.publishedDate || '—'}</p>
          </div>
        </div>
        <a href={`https://ads.google.com/`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-ink/[0.03] hover:bg-ink/[0.08] border border-ink/10 rounded-md text-[11px] font-bold text-ink/80 transition-colors">
          <ExternalLink size={14} /> Lihat di Google Ads
        </a>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Grid: Sinopsis & Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-6">
            
            {/* Sinopsis Card */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5">
              <h3 className="text-[13px] font-bold text-ink mb-4 border-b border-ink/5 pb-3">Performa Iklan</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">Konversi</p>
                  <p className="text-2xl font-light text-ink mt-1">{data.conversions > 0 ? data.conversions : '--'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">Biaya per Konversi (CPA)</p>
                  <p className="text-xl font-light text-ink mt-1">{data.cpa > 0 ? `Rp ${fIDR(data.cpa)}` : '--'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">ROAS</p>
                  <p className="text-xl font-light text-ink mt-1">{data.roas > 0 ? `${data.roas.toFixed(2)}x` : '--'}</p>
                </div>
              </div>
            </div>

            {/* Tayangan Chart Card */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5">
              <h3 className="text-[13px] font-bold text-ink mb-4 flex items-center gap-2">Tayangan & Klik</h3>
              <div className="h-48 w-full mt-2">
                {data.trend && data.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        labelFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      />
                      <Area type="monotone" dataKey="clicks" name="Klik" stroke="#3b82f6" strokeWidth={2} fill="url(#colorClicks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs bg-ink/[0.01] rounded border border-dashed border-ink/10">
                    Data trend belum tersedia
                  </div>
                )}
              </div>
            </div>

            {/* Metrik Iklan */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5 space-y-5">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-3">Interaksi Iklan</h3>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">Klik Tautan</p>
                  <p className="text-xl font-light text-ink mt-1">{data.clicks}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">CTR (rasio klik-tayang)</p>
                  <p className="text-xl font-light text-ink mt-1">{data.ctr.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">Tayangan (Impressions)</p>
                  <p className="text-xl font-light text-ink mt-1">{data.impressions.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

          </div>

          <div className="md:col-span-1 space-y-6">
            
            {/* Detail Iklan */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5 space-y-4">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-3 flex items-center justify-between">
                Detail Iklan <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-1">Aktif</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <DollarSign size={14} className="text-ink/40 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-ink">Jumlah yang dibelanjakan</p>
                    <p className="text-[10px] text-ink/60 mt-0.5">Rp {fIDR(data.spend)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Activity size={14} className="text-ink/40 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-ink">Tipe Iklan</p>
                    <p className="text-[10px] text-ink/60 mt-0.5">{data.creativeBody}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pratinjau Iklan (Google Search Simulation) */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-3 mb-4">Pratinjau Penelusuran</h3>
              
              <div className="p-3 border border-ink/10 rounded-lg bg-white shadow-sm flex flex-col gap-1.5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                     <img src="/assets/favicon.ico" alt="NINOC" className="w-3 h-3" onError={(e) => (e.currentTarget.style.display = 'none')} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[11px] font-medium text-ink leading-none">NINOC STORE</span>
                     <span className="text-[10px] text-ink/60 leading-none mt-0.5">Bersponsor • https://ninoc.store</span>
                   </div>
                </div>
                <h4 className="text-[14px] font-medium text-[#1a0dab] hover:underline cursor-pointer mt-1 leading-tight">
                  {data.creativeTitle}
                </h4>
                <p className="text-[11px] text-ink/80 leading-relaxed line-clamp-3">
                  Promo produk terbaru dari NINOC STORE. Temukan barang original dengan kualitas premium. Belanja sekarang dan dapatkan diskon spesial!
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ink/5">
                  <a href={data.creativeFinalUrl?.startsWith('http') ? data.creativeFinalUrl : `https://${data.creativeFinalUrl}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink size={10} /> {data.creativeFinalUrl}
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
