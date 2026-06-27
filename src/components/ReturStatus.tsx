"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  RefreshCw, Package, Video, Clock, Check, X, ChevronDown,
  MessageSquare, ExternalLink, Calendar, AlertCircle, Play, Pause
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReturRequest {
  id: string;
  order_id: string;
  reason: string;
  reason_label: string;
  description: string | null;
  video_url: string | null;
  video_duration_seconds: number | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  fraud_suspected: boolean | null;
  admin_notes: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending Review', color: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-400', icon: Clock },
  reviewed:  { label: 'Reviewed',       color: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-400', icon: Eye },
  approved:  { label: 'Approved',       color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-400', icon: Check },
  rejected:  { label: 'Rejected',       color: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-400', icon: X },
  completed: { label: 'Completed',      color: 'bg-gray-50 text-gray-600 border-gray-100', dot: 'bg-gray-400', icon: Check },
  cancelled: { label: 'Cancelled',      color: 'bg-gray-50 text-gray-400 border-gray-100', dot: 'bg-gray-300', icon: X },
};

const STATUS_FLOW = [
  { key: 'pending',   label: 'Diajukan' },
  { key: 'reviewed',  label: 'Reviewed' },
  { key: 'approved',  label: 'Disetujui' },
  { key: 'rejected',  label: 'Ditolak' },
  { key: 'completed', label: 'Selesai' },
];

const REASON_LABELS: Record<string, string> = {
  rusak_cacat: 'Barang Rusak / Cacat Produksi',
  salah_ukuran: 'Salah Ukuran',
  salah_warna: 'Salah Warna / Model',
  tidak_sesuai: 'Tidak Sesuai Deskripsi',
  tidak_terima: 'Barang Belum Diterima',
  lainnya: 'Lainnya',
};

function formatDate(str: string) {
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(n: number) {
  return `IDR ${n.toLocaleString('id-ID')}`;
}

function Eye({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export function ReturStatus() {
  const [returs, setReturs] = useState<ReturRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const fetchReturs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/retur');
      const json = await res.json();
      if (json.retur_requests) setReturs(json.retur_requests);
    } catch (err) {
      console.error('[ReturStatus] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { fetchReturs(); });

    // Realtime subscription for retur updates
    const channel = supabase
      .channel('customer-retur-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retur_requests' }, () => {
        fetchReturs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReturs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReturs();
    setRefreshing(false);
  };

  const handleToggleExpand = (id: string) => {
    // Pause video when collapsing
    if (expandedId === id) {
      const vid = videoRefs.current[id];
      if (vid) vid.pause();
    }
    setExpandedId(prev => prev === id ? null : id);
  };

  const filtered = returs.filter(r => filter === 'all' || r.status === filter);

  const openChat = (r: ReturRequest) => {
    window.dispatchEvent(new CustomEvent('open-support-chat'));
    setOpenChatId(r.id);
  };

  const pendingCount = returs.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">Retur Saya</h2>
          <p className="text-xs md:text-[10px] text-ink/60 mt-0.5">Riwayat pengajuan retur</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-sm">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              <p className="text-[11px] md:text-[8px] font-semibold text-amber-600 uppercase tracking-wider">{pendingCount} pending</p>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="w-7 h-7 flex items-center justify-center border border-ink/10 rounded-sm text-ink/50 hover:text-rose hover:border-rose/30 transition-colors"
          >
            <RefreshCw size={10} className={cn('transition-transform', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {['all', 'pending', 'reviewed', 'approved', 'rejected', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-2.5 py-1 text-[11px] md:text-[8px] font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors',
              filter === f ? 'bg-rose text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-5 h-5 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
          <RefreshCw size={20} className="text-ink/10" strokeWidth={1} />
          <p className="text-xs md:text-[9px] uppercase tracking-widest text-ink/50">Belum ada pengajuan retur</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => {
            const cfg = STATUS_CONFIG[r.status];
            const Tag = cfg.icon;
            const isOpen = expandedId === r.id;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border border-ink/5 rounded-sm overflow-hidden bg-white hover:border-ink/10 transition-colors"
              >
                {/* Header row */}
                <div
                  onClick={() => handleToggleExpand(r.id)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  {/* Status dot */}
                  <div className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot)} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider break-words">{r.order_id}</p>
                      <span className={cn('px-1.5 py-0.5 text-[10px] md:text-[7px] font-bold uppercase tracking-wider border rounded-sm', cfg.color)}>
                        <Tag size={7} className="inline mr-0.5" />{cfg.label}
                      </span>
                      {r.fraud_suspected && (
                        <span className="px-1.5 py-0.5 text-[10px] md:text-[7px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-100 rounded-sm flex items-center gap-0.5">
                          <AlertCircle size={7} /> Fraud?
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] md:text-[8px] text-ink/50 mt-0.5">
                      {REASON_LABELS[r.reason] || r.reason_label} &middot; {formatDate(r.created_at)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown size={12} className={cn('text-ink/20 transition-transform shrink-0', isOpen && 'rotate-180')} />
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-ink/5 overflow-hidden"
                    >
                      <div className="p-3 space-y-3">
                        {/* Description */}
                        {r.description && (
                          <div>
                            <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-1">Deskripsi</p>
                            <p className="text-xs md:text-[9px] text-ink/60 leading-relaxed">{r.description}</p>
                          </div>
                        )}

                        {/* Video Preview */}
                        {r.video_url && (
                          <div>
                            <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-1">Bukti Video</p>
                            <div className="border border-ink/5 rounded-sm overflow-hidden bg-black">
                              <video
                                ref={el => { videoRefs.current[r.id] = el; }}
                                src={r.video_url}
                                className="w-full aspect-video object-contain"
                                controls
                                preload="metadata"
                              />
                            </div>
                            {r.video_duration_seconds && (
                              <p className="text-[10px] md:text-[7px] text-ink/20 mt-1 text-right">
                                Durasi: {r.video_duration_seconds}s
                              </p>
                            )}
                          </div>
                        )}

                        {/* Refund info */}
                        {r.status === 'approved' && r.refund_amount && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-2.5">
                            <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">Refund Disetujui</p>
                            <p className="text-sm md:text-[11px] font-display italic font-bold text-emerald-700">{formatPrice(r.refund_amount)}</p>
                            {r.admin_notes && <p className="text-[11px] md:text-[8px] text-emerald-500 mt-1">{r.admin_notes}</p>}
                          </div>
                        )}

                        {/* Admin notes */}
                        {r.admin_notes && r.status !== 'approved' && (
                          <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-2.5">
                            <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-1">Catatan Admin</p>
                            <p className="text-xs md:text-[9px] text-ink/60 leading-relaxed">{r.admin_notes}</p>
                          </div>
                        )}

                        {/* Timeline */}
                        <div>
                          <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/50 mb-1">Timeline</p>
                          <div className="flex items-center gap-0">
                            {STATUS_FLOW.map((step, idx) => {
                              const stepIdx = STATUS_FLOW.findIndex(s => s.key === r.status);
                              const isDone = idx < stepIdx;
                              const isCurrent = idx === stepIdx;
                              return (
                                <React.Fragment key={step.key}>
                                  <div className="flex flex-col items-center">
                                    <div className={cn(
                                      'w-3.5 h-3.5 rounded-sm flex items-center justify-center border transition-colors',
                                      isDone
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : isCurrent
                                          ? 'bg-rose border-rose text-white'
                                          : 'border-ink/10 bg-white text-ink/20'
                                    )}>
                                      {isDone ? <Check size={7} strokeWidth={3} /> : null}
                                    </div>
                                    <p className={cn(
                                      'text-[6px] font-medium uppercase tracking-widest mt-1 text-center',
                                      isDone || isCurrent ? 'text-ink/60' : 'text-ink/20'
                                    )}>{step.label}</p>
                                  </div>
                                  {idx < STATUS_FLOW.length - 1 && (
                                    <div className={cn('flex-1 h-px mx-0.5 mb-3 transition-colors', idx < stepIdx ? 'bg-emerald-300' : 'bg-ink/5')} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openChat(r)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-ink text-white text-[11px] md:text-[8px] font-semibold uppercase tracking-wider hover:bg-rose transition-colors rounded-sm"
                          >
                            <MessageSquare size={10} /> Chat Support
                          </motion.button>
                          {r.video_url && (
                            <motion.a
                              whileTap={{ scale: 0.97 }}
                              href={r.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-ink/5 text-ink/50 text-[11px] md:text-[8px] font-semibold uppercase tracking-wider hover:bg-ink/10 transition-colors rounded-sm"
                            >
                              <ExternalLink size={10} /> Lihat Video
                            </motion.a>
                          )}
                        </div>
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
  );
}
