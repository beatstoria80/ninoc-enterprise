"use client";

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Play, Clock, MousePointer, ThumbsUp, MessageCircle, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getAdInsightsDetail } from '@/actions/metaAnalytics';
import type { MetaAdInsightsDetail } from '@/services/meta/types';
import { cn } from '@/lib/utils';

export function AdInsightsDetailPane({ adId, onClose }: { adId: string; onClose: () => void }) {
  const [data, setData] = useState<MetaAdInsightsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAdInsightsDetail(adId).then(res => {
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
        <div className="p-6">Gagal memuat detail wawasan.</div>
      </div>
    );
  }

  const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[800px] bg-[#f0f2f5] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-ink/10">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-ink/10 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full text-ink/60 transition-colors -ml-2"><X size={20} /></button>
          <div className="w-10 h-10 bg-ink/5 rounded-md overflow-hidden flex items-center justify-center border border-ink/10 shrink-0">
            {data.creativeThumbnail ? (
              <img src={data.creativeThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
            ) : (
              <Play size={16} className="text-ink/30" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink line-clamp-1">{data.name}</h2>
            <p className="text-[10px] text-ink/50 mt-0.5">Iklan • Dipublikasikan pada: {data.publishedDate || '—'}</p>
          </div>
        </div>
        <a href={`https://facebook.com/adsmanager/manage/ads?act=${data.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-ink/[0.03] hover:bg-ink/[0.08] border border-ink/10 rounded-md text-[11px] font-bold text-ink/80 transition-colors">
          <ExternalLink size={14} /> Lihat di Pengelola Iklan
        </a>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Grid: Sinopsis & Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-6">
            
            {/* Sinopsis Card */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5">
              <h3 className="text-[13px] font-bold text-ink mb-4 border-b border-ink/5 pb-3">Sinopsis</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">Pembelian</p>
                  <p className="text-2xl font-light text-ink mt-1">{data.conversions > 0 ? data.conversions : '--'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">Biaya per Pembelian</p>
                  <p className="text-xl font-light text-ink mt-1">{data.cpa > 0 ? `Rp ${fIDR(data.cpa)}` : '--'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink/70">Tayangan (Impressions)</p>
                  <p className="text-xl font-light text-ink mt-1">{data.impressions > 0 ? data.impressions.toLocaleString('id-ID') : '--'}</p>
                </div>
              </div>
            </div>

            {/* Tayangan Chart Card */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5">
              <h3 className="text-[13px] font-bold text-ink mb-4 flex items-center gap-2">Tayangan</h3>
              <div className="h-48 w-full mt-2">
                {data.trend && data.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} fill="url(#colorImp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs">Data trend belum tersedia</div>
                )}
              </div>
            </div>

            {/* Interaksi Postingan */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5 space-y-5">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-3">Interaksi Postingan</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[11px] text-ink/70">Klik Tautan</p>
                    <p className="text-sm font-semibold text-ink">{data.linkClicks}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-ink/5">
                  <div>
                    <p className="text-[11px] font-semibold text-ink/70">Klik Tautan</p>
                    <p className="text-xl font-light text-ink mt-1">{data.linkClicks}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-ink/70">CTR (rasio klik-tayang)</p>
                    <p className="text-xl font-light text-ink mt-1">{data.ctr.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Demografi & Pemirsa */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5">
              <h3 className="text-[13px] font-bold text-ink mb-4 border-b border-ink/5 pb-3">Pemirsa (Demografi)</h3>
              <div className="h-48 w-full mt-4">
                {data.demographics && data.demographics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.demographics.filter(d => d.gender !== 'Non-Biner').sort((a,b) => a.age.localeCompare(b.age))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="age" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="value" radius={[4,4,0,0]} barSize={20}>
                        {data.demographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.gender === 'Perempuan' ? '#38bdf8' : '#0284c7'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs">Data demografi belum tersedia</div>
                )}
              </div>
            </div>

          </div>

          <div className="md:col-span-1 space-y-6">
            
            {/* Detail Iklan */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5 space-y-4">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-3">Detail Iklan <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-1">Aktif</span></h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <DollarSign size={14} className="text-ink/40 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-ink">Jumlah yang dibelanjakan</p>
                    <p className="text-[10px] text-ink/60 mt-0.5">Rp {fIDR(data.spend)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Clock size={14} className="text-ink/40 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-ink">Anggaran harian</p>
                    <p className="text-[10px] text-ink/60 mt-0.5">{data.dailyBudget > 0 ? `Rp ${fIDR(data.dailyBudget)}` : 'Menggunakan anggaran kampanye'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pratinjau Iklan */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-5">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-3 mb-4">Pratinjau Iklan</h3>
              <div className="border border-ink/10 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="p-3 flex items-center gap-2 border-b border-ink/5">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">N</div>
                  <div>
                    <p className="text-[11px] font-bold text-ink">NINOC STORE</p>
                    <p className="text-[9px] text-ink/50">Bersponsor</p>
                  </div>
                </div>
                <div className="p-3 text-[11px] text-ink/80 whitespace-pre-wrap leading-relaxed">
                  {data.creativeBody || 'Belanja sekarang untuk promo eksklusif!'}
                </div>
                <div className="w-full aspect-square bg-ink/5 relative group cursor-pointer overflow-hidden">
                  {data.creativeThumbnail ? (
                    <img src={data.creativeThumbnail} alt="Ad Creative" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-ink/20">
                      <Play size={32} />
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                    <ExternalLink size={10} /> Belanja Sekarang
                  </div>
                </div>
                <div className="p-3 border-t border-ink/5 bg-ink/[0.02]">
                  <p className="text-[10px] font-bold text-ink">NINOC.STORE</p>
                  <h4 className="text-[12px] font-bold text-ink mt-0.5">Kaos Original NINOC</h4>
                  <p className="text-[10px] text-ink/50 mt-0.5">Diskon Spesial Hari Ini</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
