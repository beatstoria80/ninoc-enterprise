"use client";

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Play, Clock, MousePointer, ThumbsUp, MessageCircle, DollarSign, MoreHorizontal, Globe, Volume2, MessageSquare, Share2, Maximize2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Line } from 'recharts';
import { getAdInsightsDetail } from '@/actions/metaAnalytics';
import type { MetaAdInsightsDetail } from '@/services/meta/types';
import { cn } from '@/lib/utils';

export function AdInsightsDetailPane({ adId, onClose }: { adId: string; onClose: () => void }) {
  const [data, setData] = useState<MetaAdInsightsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for complex chart toggles
  const [activeMetrics, setActiveMetrics] = useState({
    impressions: true,
    clicks: true,
    conversions: true,
  });

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-5 space-y-4 md:space-y-5">
        
        {/* Top Grid: Sinopsis & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          
          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            
            {/* Sinopsis Card */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-4 md:p-5">
              <h3 className="text-[13px] font-bold text-ink mb-3 md:mb-4 border-b border-ink/5 pb-2.5 md:pb-3">Sinopsis</h3>
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

            {/* Kompleks Analitik Chart Card */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-3">
                <h3 className="text-[13px] font-bold text-ink flex items-center gap-2">Tren Performa Harian</h3>
                
                {/* Custom Legend / Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => toggleMetric('impressions')}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-colors border",
                      activeMetrics.impressions ? "bg-sky-50 text-sky-700 border-sky-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Tayangan
                  </button>
                  <button 
                    onClick={() => toggleMetric('clicks')}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-colors border",
                      activeMetrics.clicks ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Klik Tautan
                  </button>
                  <button 
                    onClick={() => toggleMetric('conversions')}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-colors border",
                      activeMetrics.conversions ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" : "bg-ink/5 text-ink/50 border-transparent hover:bg-ink/10"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pembelian
                  </button>
                </div>
              </div>

              <div className="h-48 md:h-56 w-full mt-2">
                {data.trend && data.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                      
                      {/* Left Y-Axis for Impressions & Clicks (Large numbers) */}
                      <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => Intl.NumberFormat('id-ID', { notation: 'compact' }).format(val)} />
                      {/* Right Y-Axis for Conversions (Small numbers) */}
                      <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                        formatter={(value: any, name: any) => {
                          if (name === 'impressions') return [value.toLocaleString(), 'Tayangan'];
                          if (name === 'clicks') return [value.toLocaleString(), 'Klik Tautan'];
                          if (name === 'conversions') return [value.toLocaleString(), 'Pembelian'];
                          return [value, name];
                        }}
                      />
                      
                      {activeMetrics.impressions && (
                        <Area yAxisId="left" type="monotone" dataKey="impressions" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorImp)" name="impressions" activeDot={{ r: 4, strokeWidth: 0 }} />
                      )}
                      {activeMetrics.clicks && (
                        <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="clicks" activeDot={{ r: 4, strokeWidth: 0 }} />
                      )}
                      {activeMetrics.conversions && (
                        <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2.5} dot={false} name="conversions" activeDot={{ r: 4, strokeWidth: 0 }} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs bg-ink/[0.02] rounded-lg border border-dashed border-ink/10">Data tren harian belum tersedia</div>
                )}
              </div>
            </div>

            {/* Interaksi Postingan */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-4 md:p-5 space-y-4 md:space-y-5">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-2.5 md:pb-3">Interaksi Postingan</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[11px] text-ink/70">Reaksi Postingan</p>
                    <p className="text-sm font-semibold text-ink">{data.postReactions}</p>
                  </div>
                  <div className="w-full bg-ink/5 h-1.5 rounded-full overflow-hidden mb-3">
                    <div className="bg-[#38bdf8] h-full" style={{ width: `${Math.min((data.postReactions / (data.postReactions + data.linkClicks + 1)) * 100, 100)}%` }} />
                  </div>

                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[11px] text-ink/70">Suka Halaman (Page Likes)</p>
                    <p className="text-sm font-semibold text-ink">{data.pageLikes}</p>
                  </div>
                  <div className="w-full bg-ink/5 h-1.5 rounded-full overflow-hidden mb-3">
                    <div className="bg-[#3b82f6] h-full" style={{ width: `${Math.min((data.pageLikes / (data.pageLikes + data.postReactions + 1)) * 100, 100)}%` }} />
                  </div>

                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[11px] text-ink/70">Pemutaran Video (Plays)</p>
                    <p className="text-sm font-semibold text-ink">{data.videoPlays}</p>
                  </div>
                  <div className="w-full bg-ink/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#8b5cf6] h-full" style={{ width: `${Math.min((data.videoThruPlays / (data.videoPlays + 1)) * 100, 100)}%` }} />
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
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-4 md:p-5">
              <h3 className="text-[13px] font-bold text-ink mb-3 md:mb-4 border-b border-ink/5 pb-2.5 md:pb-3">Pemirsa (Demografi)</h3>
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
          
          <div className="lg:col-span-1 space-y-4 md:space-y-5">
            
            {/* Detail Iklan */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-4 md:p-5 space-y-3 md:space-y-4">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-2.5 md:pb-3">Detail Iklan <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-1">Aktif</span></h3>
              
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

            {/* Pratinjau Iklan - Realistic Meta Ads Clone */}
            <div className="bg-white rounded-xl shadow-sm border border-ink/5 p-4 md:p-5">
              <h3 className="text-[13px] font-bold text-ink border-b border-ink/5 pb-2.5 md:pb-3 mb-3 md:mb-4">Pratinjau Iklan (Facebook Feed)</h3>
              
              <div className="border border-ink/10 rounded-lg overflow-hidden bg-white shadow-sm font-sans max-w-[400px] mx-auto">
                {/* Meta Post Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 border border-ink/5">
                      {data.creativePageName ? data.creativePageName.charAt(0).toUpperCase() : 'N'}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#1c1e21] leading-tight hover:underline cursor-pointer">{data.creativePageName || 'NINOC STORE'}</p>
                      <div className="flex items-center gap-1 text-[12px] text-[#65676b] mt-0.5">
                        <span>Bersponsor</span>
                        <span aria-hidden="true"> · </span>
                        <Globe size={12} className="text-[#65676b]" />
                      </div>
                    </div>
                  </div>
                  <button className="text-[#65676b] hover:bg-ink/5 p-1.5 rounded-full transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                
                {/* Meta Post Body */}
                <div className="px-3 pb-3 text-[14px] text-[#050505] whitespace-pre-wrap leading-normal font-normal">
                  {data.creativeBody || 'Temukan koleksi terbaru NINOC STORE sekarang! Bebas ongkir ke seluruh Indonesia. ✨'}
                </div>
                
                {/* Meta Video / Image Mockup */}
                <div className="w-full aspect-square bg-black relative group cursor-pointer overflow-hidden border-y border-ink/5 flex items-center justify-center">
                  {data.creativeThumbnail ? (
                    <img src={data.creativeThumbnail} alt="Ad Creative" className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <div className="w-full h-full bg-[#1c1e21] flex items-center justify-center"></div>
                  )}
                  
                  {/* Video Player UI Overlay */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/90 border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={24} className="ml-1" fill="currentColor" />
                    </div>
                  </div>
                  
                  {/* Sound & Expand */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <div className="bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white/90">
                      <Volume2 size={14} />
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white/90">
                      <Maximize2 size={14} />
                    </div>
                  </div>
                  
                  {/* Progress Bar Mockup */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                    <div className="h-full bg-white/80 w-1/3"></div>
                  </div>
                </div>
                
                {/* Meta Call to Action Strip */}
                <div className="px-4 py-2 bg-[#f0f2f5] flex items-center justify-between border-b border-ink/5 hover:bg-[#e4e6eb] cursor-pointer transition-colors">
                  <div className="max-w-[70%]">
                    <p className="text-[12px] text-[#65676b] uppercase tracking-wider">{data.creativeLinkCaption || 'NINOC.STORE'}</p>
                    <h4 className="text-[15px] font-bold text-[#1c1e21] mt-0.5 truncate">{data.creativeTitle || data.name || 'Belanja Sekarang - Diskon Spesial'}</h4>
                    <p className="text-[13px] text-[#65676b] mt-0.5 truncate">{data.creativeLinkDescription || ''}</p>
                  </div>
                  <div className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-bold text-[14px] px-4 py-1.5 rounded-md transition-colors shrink-0">
                    Belanja Sekarang
                  </div>
                </div>
                
                {/* Meta Interactions (Reactions) */}
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#ced0d4]/50">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 bg-[#1877f2] rounded-full flex items-center justify-center text-white ring-2 ring-white z-20">
                        <ThumbsUp size={10} fill="currentColor" />
                      </div>
                      <div className="w-5 h-5 bg-[#f51a2c] rounded-full flex items-center justify-center text-white ring-2 ring-white z-10">
                        <span className="text-[14px] leading-none mb-0.5 ml-0.5">❤️</span>
                      </div>
                    </div>
                    <span className="text-[13px] text-[#65676b] hover:underline cursor-pointer">{data.postReactions.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[13px] text-[#65676b] flex gap-3">
                    <span className="hover:underline cursor-pointer">{(data.postReactions / 3).toFixed(0)} Komentar</span>
                    <span className="hover:underline cursor-pointer">{(data.postReactions / 8).toFixed(0)} Kali dibagikan</span>
                  </div>
                </div>
                
                {/* Meta Action Buttons */}
                <div className="px-1 py-1 flex items-center justify-between text-[#65676b] font-semibold text-[14px]">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-ink/5 rounded-md transition-colors">
                    <ThumbsUp size={18} /> Suka
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-ink/5 rounded-md transition-colors">
                    <MessageSquare size={18} /> Komentari
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-ink/5 rounded-md transition-colors">
                    <Share2 size={18} /> Bagikan
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
