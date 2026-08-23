"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, Globe, Camera, MonitorSmartphone, Heart, MessageCircle, ImageIcon, AlertCircle, TrendingUp, BarChart3, CalendarDays, Lightbulb, Sparkles, Eye, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetaOrganicData } from '@/actions/metaAnalytics';

interface OrganicAnalyticsViewProps {
  data: MetaOrganicData;
  timeFilter: string;
}

export function OrganicAnalyticsView({ data, timeFilter }: OrganicAnalyticsViewProps) {
  const [organicTab, setOrganicTab] = useState<'instagram' | 'facebook'>('instagram');

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

  const currentPlatformMetrics = data[organicTab];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {data.error && (
        <div className="bg-red-50/80 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-4">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">Sebagian Data Mungkin Tidak Tersedia</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-200 text-red-800 font-bold uppercase tracking-wider">Warning</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">{data.error.replace(/Data yang ditampilkan adalah simulasi\./gi, '')}</p>
          </div>
        </div>
      )}

      {/* ORGANIC TAB SELECTOR */}
      <div className="flex items-center gap-6 border-b border-ink/10 pb-1">
        <button 
          onClick={() => setOrganicTab('instagram')}
          className={cn("text-sm font-bold pb-3 border-b-2 transition-colors flex items-center gap-2", organicTab === 'instagram' ? "text-pink-600 border-pink-600" : "text-ink/40 border-transparent hover:text-ink/80")}
        >
          <Camera size={16} className={organicTab === 'instagram' ? "text-pink-500" : ""} /> Instagram
        </button>
        <button 
          onClick={() => setOrganicTab('facebook')}
          className={cn("text-sm font-bold pb-3 border-b-2 transition-colors flex items-center gap-2", organicTab === 'facebook' ? "text-blue-600 border-blue-600" : "text-ink/40 border-transparent hover:text-ink/80")}
        >
          <MonitorSmartphone size={16} className={organicTab === 'facebook' ? "text-blue-500" : ""} /> Facebook Page
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

            {/* DERIVED STRATEGIC KPIs - Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" /> Engagement Rate
                </p>
                <p className="text-2xl font-mono font-extrabold text-amber-900">{currentPlatformMetrics.engagementRate}%</p>
                <p className="text-[9px] text-amber-700/50 mt-1">{currentPlatformMetrics.engagementRate >= 3 ? 'Sangat Bagus' : currentPlatformMetrics.engagementRate >= 1 ? 'Normal' : 'Di Bawah Rata-rata'}</p>
              </div>
              <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart3 size={12} className={organicTab === 'instagram' ? 'text-pink-500' : 'text-blue-500'} /> Avg. Reach/Post
                </p>
                <p className="text-2xl font-mono font-extrabold text-ink">{currentPlatformMetrics.avgReachPerPost.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp size={12} className={currentPlatformMetrics.growthRate >= 0 ? 'text-emerald-500' : 'text-red-500'} /> Growth Rate
                </p>
                <p className={cn("text-2xl font-mono font-extrabold", currentPlatformMetrics.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {currentPlatformMetrics.growthRate >= 0 ? '+' : ''}{currentPlatformMetrics.growthRate}%
                </p>
              </div>
              <div className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarDays size={12} className="text-violet-500" /> Hari Terbaik Posting
                </p>
                <p className="text-2xl font-extrabold text-ink">{currentPlatformMetrics.bestDay}</p>
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
                {organicTab === 'instagram' ? <Camera size={16} className="text-pink-600" /> : <MonitorSmartphone size={16} className="text-blue-600" />}
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
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-center">
                           <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                             <div className="flex items-center gap-2 text-white" title="Likes">
                               <Heart size={14} className="fill-white" />
                               <span className="text-[11px] font-bold font-mono">{post.likes?.toLocaleString()}</span>
                             </div>
                             <div className="flex items-center gap-2 text-white" title="Komentar">
                               <MessageCircle size={14} className="fill-white" />
                               <span className="text-[11px] font-bold font-mono">{post.comments?.toLocaleString()}</span>
                             </div>
                             {post.shares !== undefined && (
                               <div className="flex items-center gap-2 text-white" title="Dibagikan">
                                 <Share2 size={14} />
                                 <span className="text-[11px] font-bold font-mono">{post.shares?.toLocaleString()}</span>
                               </div>
                             )}
                             {post.saved !== undefined && (
                               <div className="flex items-center gap-2 text-white" title="Disimpan">
                                 <Bookmark size={14} className="fill-white" />
                                 <span className="text-[11px] font-bold font-mono">{post.saved?.toLocaleString()}</span>
                               </div>
                             )}
                             {post.reach !== undefined && (
                               <div className="flex items-center gap-2 text-white/90 pt-2 border-t border-white/20 col-span-2">
                                 <Globe size={14} />
                                 <span className="text-[10px] uppercase font-bold tracking-wider">Tayang:</span>
                                 <span className="text-[11px] font-bold font-mono ml-auto">{post.reach?.toLocaleString()}</span>
                               </div>
                             )}
                             {post.views !== undefined && (
                               <div className="flex items-center gap-2 text-white/90 col-span-2">
                                 <Eye size={14} />
                                 <span className="text-[10px] uppercase font-bold tracking-wider">Dilihat:</span>
                                 <span className="text-[11px] font-bold font-mono ml-auto">{post.views?.toLocaleString()}</span>
                               </div>
                             )}
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

            {/* STRATEGIC INSIGHTS PANEL */}
            {currentPlatformMetrics.strategicInsights && currentPlatformMetrics.strategicInsights.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50/80 to-indigo-50/50 border border-violet-200/60 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-violet-900 flex items-center gap-2 mb-4">
                  <Lightbulb size={16} className="text-violet-600" />
                  Strategic Insights & Rekomendasi
                </h3>
                <div className="space-y-3">
                  {currentPlatformMetrics.strategicInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-3.5 rounded-lg border border-violet-100/80 shadow-sm">
                      <span className="text-sm shrink-0 mt-0.5">{insight.substring(0, 2)}</span>
                      <p className="text-xs text-violet-900/80 leading-relaxed">{insight.substring(2).trim()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* BEST DAY & CONTENT SCORE PANEL */}
            <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-500" />
                Skor Performa Konten
              </h3>
              <div className="space-y-4">
                <div className="text-center py-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                  <p className="text-4xl font-mono font-extrabold text-amber-700">{currentPlatformMetrics.contentScore}</p>
                  <p className="text-[10px] text-amber-600/70 font-bold uppercase tracking-wider mt-1">Content Score</p>
                  <p className="text-[9px] text-amber-600/50 mt-0.5">(likes + komentar×3) / reach × 100</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-ink/[0.02] rounded-lg border border-ink/5">
                  <div>
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">Hari Terbaik</p>
                    <p className="text-sm font-extrabold text-ink mt-0.5">{currentPlatformMetrics.bestDay}</p>
                  </div>
                  <CalendarDays size={20} className="text-violet-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-ink/[0.02] rounded-lg border border-ink/5">
                  <div>
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">Engagement Rate</p>
                    <p className={cn("text-sm font-extrabold mt-0.5", currentPlatformMetrics.engagementRate >= 3 ? 'text-emerald-600' : currentPlatformMetrics.engagementRate >= 1 ? 'text-amber-600' : 'text-red-600')}>
                      {currentPlatformMetrics.engagementRate}%
                    </p>
                  </div>
                  <Activity size={20} className="text-amber-400" />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
