"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from '@/components/LocalizedLink';
import { ArrowLeft, RefreshCw, Clock, CheckCircle, XCircle, Package, ChevronRight, AlertCircle, Eye, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export interface ReturRequest {
  id: string;
  order_id: string;
  reason: string;
  reason_label: string;
  description: string | null;
  video_url: string | null;
  video_duration_seconds: number | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  fraud_suspected: boolean | null;
  fraud_reasons: string[] | null;
  admin_notes: string | null;
  refund_amount: number | null;
  refund_method: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const STATUS_FLOW = [
  { key: 'pending',   label: 'Diajukan',   icon: Clock,       color: 'bg-amber-50 border-amber-200 text-amber-600' },
  { key: 'reviewed',  label: 'Reviewed',   icon: Eye,        color: 'bg-blue-50 border-blue-200 text-blue-600' },
  { key: 'approved',  label: 'Disetujui',  icon: CheckCircle, color: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { key: 'rejected',  label: 'Ditolak',    icon: XCircle,     color: 'bg-red-50 border-red-200 text-red-600' },
  { key: 'completed', label: 'Selesai',    icon: CheckCircle, color: 'bg-gray-50 border-gray-200 text-gray-500' },
];

const REASON_LABELS: Record<string, string> = {
  rusak_cacat: 'Barang Rusak / Cacat Produksi',
  salah_ukuran: 'Salah Ukuran',
  salah_warna: 'Salah Warna / Model',
  tidak_sesuai: 'Tidak Sesuai Deskripsi',
  lainnya: 'Lainnya',
};

const EASING = { out: [0.23, 1, 0.32, 1] } as const;

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ReturnsClient({ initialReturns, userId }: { initialReturns: ReturRequest[], userId: string }) {
  const [returns, setReturns] = useState<ReturRequest[]>(initialReturns);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('user_id', userId);
      params.set('limit', '50');
      const res = await fetch(`/api/retur?${params}`);
      const json = await res.json();
      const data: ReturRequest[] = json.retur_requests || [];
      setReturns(data);
    } catch (err) {
      console.error('[ReturnsPage] fetch error:', err);
    }
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReturns();
    setRefreshing(false);
  };

  const filtered = returns.filter(r => {
    if (filter === 'pending') return ['pending', 'reviewed', 'approved'].includes(r.status);
    if (filter === 'completed') return ['completed', 'rejected', 'cancelled'].includes(r.status);
    return true;
  });

  const getStatusIndex = (status: string) => STATUS_FLOW.findIndex(s => s.key === status);

  return (
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white">
      <div className="max-w-[800px] mx-auto px-6 pt-24 md:pt-40 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/profile" className="flex items-center gap-2 text-ink/50 hover:text-ink transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs md:text-[10px] uppercase tracking-[0.2em]">Exit to Profile</span>
          </Link>
          <div className="text-right">
            <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/50 mb-1">Return & Refund</p>
            <h1 className="text-xl font-display italic font-medium uppercase tracking-tight">Return Tracker</h1>
          </div>
        </div>

        {/* Filter Tabs + Refresh */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={handleRefresh}
            className="w-7 h-7 flex items-center justify-center border border-ink/10 rounded-sm text-ink/50 hover:text-rose hover:border-rose/30 transition-colors shrink-0"
          >
            <RefreshCw size={10} className={cn('transition-transform', refreshing && 'animate-spin')} />
          </button>
          {([
            { id: 'all' as const, label: 'All' },
            { id: 'pending' as const, label: 'Active' },
            { id: 'completed' as const, label: 'History' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-4 py-2 text-xs md:text-[9px] font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors",
                filter === tab.id ? "bg-ink text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/10"
              )}
            >
              {tab.label}
              {tab.id === 'pending' && returns.filter(r => ['pending', 'reviewed'].includes(r.status)).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] md:text-[7px] rounded-sm bg-rose/10 text-rose">
                  {returns.filter(r => ['pending', 'reviewed'].includes(r.status)).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-16 h-16 bg-ink/5 rounded-full flex items-center justify-center">
              <RefreshCw size={24} strokeWidth={1} className="text-ink/20" />
            </div>
            <div>
              <p className="text-xs md:text-[10px] font-semibold uppercase tracking-widest text-ink/60">No Returns Found</p>
              <p className="text-xs md:text-[9px] text-ink/20 mt-1 italic">Return history will appear here</p>
            </div>
            <Link href="/profile" className="text-xs md:text-[9px] text-rose hover:underline uppercase tracking-widest">
              Browse Orders
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ret, idx) => {
              const statusIdx = getStatusIndex(ret.status);
              const statusCfg = STATUS_FLOW[statusIdx] ?? STATUS_FLOW[0];
              const StatusIcon = statusCfg.icon;

              return (
                <motion.div
                  key={ret.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border border-ink/5 bg-white hover:border-ink/10 transition-all duration-200 rounded-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedId(expandedId === ret.id ? null : ret.id)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    <div className={cn("w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border", statusCfg.color)}>
                      <StatusIcon size={14} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider font-mono">{ret.order_id}</span>
                        <span className={cn('px-1.5 py-0.5 text-[10px] md:text-[7px] font-bold uppercase tracking-widest rounded-sm border', statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                        {ret.fraud_suspected && (
                          <span className="px-1.5 py-0.5 text-[10px] md:text-[7px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-100 rounded-sm flex items-center gap-0.5">
                            <AlertCircle size={8} /> Fraud?
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-[7px] text-ink/50 mt-0.5">
                        {REASON_LABELS[ret.reason] || ret.reason_label || ret.reason} · {formatDate(ret.created_at)}
                      </p>
                    </div>
                    {ret.refund_amount && (
                      <div className="text-right shrink-0">
                        <p className="text-sm md:text-[11px] font-display italic font-medium text-emerald-600">
                          IDR {ret.refund_amount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] md:text-[7px] text-ink/50">Refund</p>
                      </div>
                    )}
                    <motion.div
                      animate={{ rotate: expandedId === ret.id ? 90 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-ink/20 shrink-0"
                    >
                      <ChevronRight size={12} />
                    </motion.div>
                  </button>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {expandedId === ret.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASING.out }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-ink/5">

                          {/* Timeline — accurate for all statuses */}
                          <div className="pt-4">
                            <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-3">Status Timeline</p>
                            <div className="flex items-center gap-0">
                              {STATUS_FLOW.map((step, i) => {
                                const Icon = step.icon;
                                const isDone = i < statusIdx;
                                const isCurrent = i === statusIdx;
                                return (
                                  <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center">
                                      <div className={cn(
                                        "w-7 h-7 rounded-sm flex items-center justify-center border transition-colors",
                                        isDone
                                          ? "bg-emerald-500 border-emerald-500 text-white"
                                          : isCurrent
                                            ? step.color
                                            : "bg-ink/5 border-ink/10 text-ink/20"
                                      )}>
                                        {isDone ? (
                                          <CheckCircle size={12} strokeWidth={2} />
                                        ) : (
                                          <Icon size={12} strokeWidth={1.5} />
                                        )}
                                      </div>
                                      <p className={cn(
                                        "text-[6px] font-medium uppercase tracking-widest mt-1.5 text-center",
                                        isDone || isCurrent ? "text-ink/70" : "text-ink/20"
                                      )}>
                                        {step.label}
                                      </p>
                                    </div>
                                    {i < STATUS_FLOW.length - 1 && (
                                      <div className={cn("flex-1 h-px mx-1 mb-4 transition-colors", i < statusIdx ? "bg-emerald-400" : "bg-ink/5")} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>

                          {/* Description */}
                          {ret.description && (
                            <div className="bg-ink/[0.01] border border-ink/5 p-3 rounded-sm">
                              <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-1.5">Deskripsi</p>
                              <p className="text-xs md:text-[10px] text-ink/70 leading-relaxed">{ret.description}</p>
                            </div>
                          )}

                          {/* Video Evidence */}
                          {ret.video_url && (
                            <div className="border border-ink/5 rounded-sm overflow-hidden">
                              <div className="px-3 pt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50">Bukti Video Unboxing</p>
                                  {ret.video_duration_seconds && (
                                    <span className="text-[10px] md:text-[7px] text-ink/20">{ret.video_duration_seconds}s · 1-shot</span>
                                  )}
                                </div>
                                {ret.fraud_suspected && (
                                  <span className="px-2 py-1 bg-red-50 text-red-500 text-[10px] md:text-[7px] font-bold uppercase tracking-wider border border-red-100 rounded-sm">Fraud Flagged</span>
                                )}
                              </div>
                              <video
                                src={ret.video_url}
                                controls
                                preload="metadata"
                                className="w-full aspect-video bg-black mt-2"
                              />
                              {ret.fraud_reasons && ret.fraud_reasons.length > 0 && (
                                <div className="px-3 pb-3 pt-2 space-y-1">
                                  {ret.fraud_reasons.map((r, i) => (
                                    <p key={i} className="text-[11px] md:text-[8px] text-red-400 flex items-start gap-1">
                                      <AlertCircle size={9} className="shrink-0 mt-0.5" />{r}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Admin Notes */}
                          {ret.admin_notes && (
                            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-sm">
                              <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-amber-500 mb-1.5">Catatan Admin</p>
                              <p className="text-xs md:text-[10px] text-ink/70 leading-relaxed">{ret.admin_notes}</p>
                            </div>
                          )}

                          {/* Refund Approved Banner */}
                          {ret.status === 'approved' && ret.refund_amount && (
                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-sm space-y-1">
                              <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-emerald-600 mb-1.5">Refund Disetujui</p>
                              <p className="text-[13px] font-display italic font-bold text-emerald-700">
                                IDR {ret.refund_amount.toLocaleString('id-ID')}
                              </p>
                              <p className="text-[11px] md:text-[8px] text-emerald-500/70 mt-1">
                                {ret.refund_method === 'transfer' ? 'Dana ditransfer ke rekening Anda' : 'Refund via metode pembayaran asli'}
                              </p>
                            </div>
                          )}

                          {/* Policy Info */}
                          {!['completed', 'rejected', 'cancelled'].includes(ret.status) && (
                            <div className="bg-rose/[0.02] border border-rose/10 p-3 rounded-sm space-y-1">
                              <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-rose/60 mb-1.5">Info Proses</p>
                              <p className="text-[11px] md:text-[8px] text-ink/60 leading-relaxed flex items-start gap-1.5">
                                <span className="text-rose/40 font-bold shrink-0">•</span>
                                Pengajuan maksimal 2x24 jam setelah barang diterima
                              </p>
                              <p className="text-[11px] md:text-[8px] text-ink/60 leading-relaxed flex items-start gap-1.5">
                                <span className="text-rose/40 font-bold shrink-0">•</span>
                                Bukti video 1-shot tanpa edit WAJIB
                              </p>
                              <p className="text-[11px] md:text-[8px] text-ink/60 leading-relaxed flex items-start gap-1.5">
                                <span className="text-rose/40 font-bold shrink-0">•</span>
                                Refund diproses 3–7 hari kerja setelah persetujuan
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
