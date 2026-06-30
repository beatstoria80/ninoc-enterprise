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
  return_awb: string | null;
  return_courier: string | null;
  return_shipped_at: string | null;
  qc_status?: string;
  qc_notes?: string;
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
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">Retur Saya</h2>
          <p className="text-[10px] text-ink/70 mt-px">Riwayat pengajuan retur</p>
        </div>
        <div className="flex items-center gap-1.5">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-sm">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">{pendingCount} pending</p>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/50 hover:text-rose hover:border-rose/30 transition-colors"
          >
            <RefreshCw size={9} className={cn('transition-transform', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
        {['all', 'pending', 'reviewed', 'approved', 'rejected', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors',
              filter === f ? 'bg-rose text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-4 h-4 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-1.5">
          <RefreshCw size={16} className="text-ink/10" strokeWidth={1} />
          <p className="text-[10px] uppercase tracking-widest text-ink/70">Belum ada pengajuan retur</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((r, i) => {
            const cfg = STATUS_CONFIG[r.status];
            const Tag = cfg.icon;
            const isOpen = expandedId === r.id;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border border-ink/5 rounded-sm overflow-hidden bg-white hover:border-ink/10 transition-colors"
              >
                {/* Header row */}
                <div
                  onClick={() => handleToggleExpand(r.id)}
                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer"
                >
                  {/* Status dot */}
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-ink uppercase tracking-wider break-words">{r.order_id}</p>
                      <span className={cn('px-1 py-px text-[9px] font-bold uppercase tracking-wider border rounded-sm', cfg.color)}>
                        <Tag size={6} className="inline mr-px" />{cfg.label}
                      </span>
                      {r.fraud_suspected && (
                        <span className="px-1 py-px text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-100 rounded-sm flex items-center gap-px">
                          <AlertCircle size={6} /> Fraud?
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink/70 mt-px">
                      {REASON_LABELS[r.reason] || r.reason_label} &middot; {formatDate(r.created_at)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown size={10} className={cn('text-ink/40 transition-transform shrink-0', isOpen && 'rotate-180')} />
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
                      <div className="px-2.5 py-2 space-y-2">
                        {/* Description */}
                        {r.description && (
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70 mb-0.5">Deskripsi</p>
                            <p className="text-[10px] text-ink/70 leading-snug">{r.description}</p>
                          </div>
                        )}

                        {/* Video Preview */}
                        {r.video_url && (
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70 mb-0.5">Bukti Video</p>
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
                              <p className="text-[9px] text-ink/50 mt-0.5 text-right">
                                Durasi: {r.video_duration_seconds}s
                              </p>
                            )}
                          </div>
                        )}

                        {/* QC Audit Results */}
                        {r.status === 'completed' && r.qc_status === 'valid_ninoc_fault' && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-2">
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-600 mb-0.5">QC Audit: Klaim Valid</p>
                            <p className="text-[10px] text-emerald-700 leading-snug">
                              Mohon maaf atas kesalahan kami. Barang telah diperiksa dan proses penggantian (Exchange) atau Refund sedang diproses.
                            </p>
                          </div>
                        )}
                        {r.status === 'rejected' && r.qc_status === 'fraud_non_ninoc' && (
                          <div className="bg-red-50 border border-red-100 rounded-sm p-2 flex items-start gap-2">
                            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 mb-0.5">RETUR DITOLAK (FRAUD)</p>
                              <p className="text-[10px] text-red-700 leading-snug font-medium">
                                Barang yang dikembalikan tidak sesuai / bukan produk Ninoc asli. Klaim retur dibatalkan sepihak oleh sistem.
                              </p>
                              {r.qc_notes && <p className="text-[9px] text-red-500 mt-1 italic">Catatan Gudang: {r.qc_notes}</p>}
                            </div>
                          </div>
                        )}

                        {/* Refund info */}
                        {r.status === 'approved' && r.refund_amount && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-2">
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-600 mb-0.5">Refund Disetujui</p>
                            <p className="text-xs font-display italic font-bold text-emerald-700">{formatPrice(r.refund_amount)}</p>
                            {r.admin_notes && <p className="text-[10px] text-emerald-500 mt-0.5">{r.admin_notes}</p>}
                          </div>
                        )}

                        {/* Instruksi Pengiriman & Resi */}
                        {r.status === 'approved' && !r.return_awb && (
                          <div className="bg-ink/[0.02] border border-ink/10 rounded-sm p-2 space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink flex items-center gap-1"><Package size={10}/> Tindakan: Kirim Barang</p>
                            <p className="text-[10px] text-ink/70 leading-snug">
                              Retur disetujui. Kemas barang dan kirimkan ke:<br/>
                              <strong>Gudang NINOC Archive</strong><br/>
                              Jl. Sudirman No. 123, Jakarta Selatan<br/>
                              <span className="text-[9px] italic opacity-70">(Ongkir ditanggung pembeli kecuali ada kesepakatan lain)</span>
                            </p>
                            <div className="pt-1.5 border-t border-ink/5">
                              <p className="text-[10px] font-semibold text-ink/80 mb-1">Input Resi Pengembalian</p>
                              <div className="flex flex-col sm:flex-row gap-1.5">
                                <input 
                                  type="text" 
                                  id={`courier-${r.id}`}
                                  placeholder="Kurir (JNT/JNE/...)" 
                                  className="w-full sm:w-1/3 px-2 py-1 text-[10px] border border-ink/10 rounded-sm bg-white focus:outline-none focus:border-ink/50"
                                />
                                <input 
                                  type="text" 
                                  id={`awb-${r.id}`}
                                  placeholder="Nomor Resi / AWB" 
                                  className="w-full sm:flex-1 px-2 py-1 text-[10px] border border-ink/10 rounded-sm bg-white focus:outline-none focus:border-ink/30"
                                />
                                <button 
                                  onClick={async () => {
                                    const courier = (document.getElementById(`courier-${r.id}`) as HTMLInputElement)?.value;
                                    const awb = (document.getElementById(`awb-${r.id}`) as HTMLInputElement)?.value;
                                    if (!courier || !awb) return alert('Kurir dan Resi wajib diisi');
                                    try {
                                      const res = await fetch(`/api/retur/${r.id}/shipping`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ return_courier: courier, return_awb: awb, order_id: r.order_id })
                                      });
                                      if(res.ok) handleRefresh();
                                      else alert('Gagal menyimpan resi');
                                    } catch(e) { alert('Error: ' + e); }
                                  }}
                                  className="px-2 py-1 bg-ink text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-rose transition-colors whitespace-nowrap"
                                >
                                  Submit Resi
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Info Resi Terkirim */}
                        {r.return_awb && (
                          <div className="bg-blue-50 border border-blue-100 rounded-sm p-2 flex items-start gap-2">
                            <Package size={12} className="text-blue-500 mt-px" />
                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-widest text-blue-600 mb-px">Barang Dikirim Kembali</p>
                              <p className="text-[10px] font-bold text-blue-700">{r.return_courier?.toUpperCase()} - {r.return_awb}</p>
                              <p className="text-[9px] text-blue-500 mt-0.5">Tim gudang akan memproses setelah barang tiba.</p>
                            </div>
                          </div>
                        )}

                        {/* Admin notes */}
                        {r.admin_notes && r.status !== 'approved' && r.qc_status !== 'fraud_non_ninoc' && (
                          <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-2">
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70 mb-0.5">Catatan Admin</p>
                            <p className="text-[10px] text-ink/70 leading-snug">{r.admin_notes}</p>
                          </div>
                        )}

                        {/* Timeline */}
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/70 mb-1">Timeline</p>
                          <div className="flex items-center gap-0">
                            {STATUS_FLOW.map((step, idx) => {
                              const stepIdx = STATUS_FLOW.findIndex(s => s.key === r.status);
                              const isDone = idx < stepIdx;
                              const isCurrent = idx === stepIdx;
                              return (
                                <React.Fragment key={step.key}>
                                  <div className="flex flex-col items-center">
                                    <div className={cn(
                                      'w-3 h-3 rounded-sm flex items-center justify-center border transition-colors',
                                      isDone
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : isCurrent
                                          ? 'bg-rose border-rose text-white'
                                          : 'border-ink/10 bg-white text-ink/40'
                                    )}>
                                      {isDone ? <Check size={6} strokeWidth={3} /> : null}
                                    </div>
                                    <p className={cn(
                                      'text-[8px] font-medium uppercase tracking-widest mt-0.5 text-center',
                                      isDone || isCurrent ? 'text-ink/70' : 'text-ink/40'
                                    )}>{step.label}</p>
                                  </div>
                                  {idx < STATUS_FLOW.length - 1 && (
                                    <div className={cn('flex-1 h-px mx-px mb-2.5 transition-colors', idx < stepIdx ? 'bg-emerald-300' : 'bg-ink/5')} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openChat(r)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-ink text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-rose transition-colors rounded-sm"
                          >
                            <MessageSquare size={9} /> Chat Support
                          </motion.button>
                          {r.video_url && (
                            <motion.a
                              whileTap={{ scale: 0.97 }}
                              href={r.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-ink/5 text-ink/50 text-[10px] font-semibold uppercase tracking-wider hover:bg-ink/10 transition-colors rounded-sm"
                            >
                              <ExternalLink size={9} /> Lihat Video
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
