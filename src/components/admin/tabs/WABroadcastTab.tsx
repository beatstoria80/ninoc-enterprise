"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Users, Package, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronDown, Search, Loader2, Wifi, WifiOff, X, Play, Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Segment = 'all' | 'has_order' | 'new_customer' | 'specific';
type SessionStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'cancelled';

interface BroadcastSession {
  id: string;
  name: string;
  segment: string;
  template_name: string;
  template_message: string;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  status: SessionStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface WAStatus {
  configured: boolean;
  phone_number_id: string | null;
  today: { sent: number; failed: number };
}

const SEGMENTS: { value: Segment; label: string; desc: string }[] = [
  { value: 'all', label: 'Semua Konsumen', desc: 'Kirim ke semua customer yang punya nomor WA' },
  { value: 'has_order', label: 'Pernah Belanja', desc: 'Customer yang sudah pernah menyelesaikan pesanan (delivered)' },
  { value: 'new_customer', label: 'Customer Baru', desc: 'Customer yang registrasi dalam 30 hari terakhir' },
];

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    draft: { label: 'Draft', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: Clock },
    queued: { label: 'Antrian', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', icon: Clock },
    processing: { label: 'Diproses', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', icon: Loader2 },
    completed: { label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
    cancelled: { label: 'Batal', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: XCircle },
  };
  const cfg = map[status] || map.draft;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 border text-[11px] md:text-[8px] font-bold uppercase tracking-widest rounded-sm', cfg.color, cfg.bg)}>
      <Icon size={8} /> {cfg.label}
    </span>
  );
}

export function WABroadcastTab() {
  const [sessions, setSessions] = useState<BroadcastSession[]>([]);
  const [waStatus, setWaStatus] = useState<WAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<BroadcastSession | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // New broadcast form
  const [showForm, setShowForm] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // ─── Fetch sessions + status ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sessionsRes, statusRes] = await Promise.all([
          fetch('/api/whatsapp/broadcast'),
          fetch('/api/whatsapp/send'),
        ]);
        const sessionsData = await sessionsRes.json();
        const statusData = await statusRes.json();
        if (sessionsData.sessions) setSessions(sessionsData.sessions);
        if (statusData.configured !== undefined) setWaStatus(statusData);
      } catch (err) {
        console.error('[WABroadcastTab] Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  // ─── Submit broadcast ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) { setSubmitError('Nama campaign wajib diisi'); return; }
    if (!message.trim()) { setSubmitError('Pesan promo wajib diisi'); return; }
    if (message.length > 1024) { setSubmitError('Pesan maksimal 1024 karakter'); return; }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          segment,
          promo_text: message,
          template_name: 'promo_broadcast',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Gagal membuat campaign');
        return;
      }

      setSubmitSuccess(`Campaign "${campaignName}" berhasil dibuat. ${data.total_recipients} penerima masuk antrian.`);
      setCampaignName('');
      setMessage('');
      setSegment('all');
      setShowForm(false);
      refresh();
    } catch {
      setSubmitError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const isConfigured = waStatus?.configured ?? false;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-[13px] font-display italic font-medium uppercase tracking-widest text-ink">
            WhatsApp Broadcast
          </h2>
          <p className="text-[11px] md:text-[8px] text-ink/30 uppercase tracking-widest mt-0.5">
            Kirim pesan promo massal via WhatsApp Cloud API
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-ink/10 rounded-sm">
            {isConfigured ? (
              <>
                <Wifi size={10} className="text-emerald-500" />
                <span className="text-[11px] md:text-[8px] font-semibold text-emerald-500 uppercase tracking-wider">WA Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={10} className="text-red-400" />
                <span className="text-[11px] md:text-[8px] font-semibold text-red-400 uppercase tracking-wider">Not Configured</span>
              </>
            )}
          </div>
          {/* Refresh */}
          <button
            onClick={refresh}
            className="w-7 h-7 flex items-center justify-center border border-ink/10 rounded-sm hover:bg-rose/5 hover:border-rose/20 transition-colors"
          >
            <RefreshCw size={11} className={cn('text-ink/40', loading && 'animate-spin')} />
          </button>
          {/* New campaign */}
          <button
            onClick={() => setShowForm(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-rose text-white rounded-sm text-xs md:text-[9px] font-bold uppercase tracking-wider hover:bg-rose/90 transition-colors"
          >
            <Send size={10} />
            {showForm ? 'Batal' : 'Campaign Baru'}
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      {waStatus && (
        <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
          <div className="bg-white border border-ink/5 p-4 rounded-sm text-center">
            <p className="text-[22px] font-display italic font-bold text-emerald-500">{waStatus.today.sent}</p>
            <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest mt-1">Terkirim Hari Ini</p>
          </div>
          <div className="bg-white border border-ink/5 p-4 rounded-sm text-center">
            <p className="text-[22px] font-display italic font-bold text-red-400">{waStatus.today.failed}</p>
            <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest mt-1">Gagal Hari Ini</p>
          </div>
          <div className="bg-white border border-ink/5 p-4 rounded-sm text-center">
            <p className="text-[22px] font-display italic font-bold text-ink">{sessions.filter(s => s.status === 'queued' || s.status === 'processing').length}</p>
            <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest mt-1">Campaign Aktif</p>
          </div>
        </div>
      )}

      {/* ─── New Campaign Form ─── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4 shrink-0"
          >
            <form onSubmit={handleSubmit} className="bg-white border border-rose/20 rounded-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-rose">Campaign Baru</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-ink/20 hover:text-ink">
                  <X size={12} />
                </button>
              </div>

              {/* Campaign name */}
              <div>
                <label className="block text-[11px] md:text-[8px] font-semibold uppercase tracking-widest text-ink/40 mb-1.5">Nama Campaign</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="Contoh: Promo Juni 2026 — Diskon 20%"
                  maxLength={100}
                  className="w-full px-3 py-2.5 border border-ink/10 rounded-sm text-sm md:text-[11px] focus:outline-none focus:border-rose/40 transition-colors"
                />
              </div>

              {/* Segment */}
              <div>
                <label className="block text-[11px] md:text-[8px] font-semibold uppercase tracking-widest text-ink/40 mb-2">Segmentasi Penerima</label>
                <div className="grid grid-cols-3 gap-2">
                  {SEGMENTS.map(seg => (
                    <button
                      key={seg.value}
                      type="button"
                      onClick={() => setSegment(seg.value)}
                      className={cn(
                        'p-3 border rounded-sm text-left transition-all',
                        segment === seg.value
                          ? 'border-rose bg-rose/5'
                          : 'border-ink/10 hover:border-rose/20'
                      )}
                    >
                      <p className="text-xs md:text-[9px] font-bold uppercase tracking-wider text-ink">{seg.label}</p>
                      <p className="text-[10px] md:text-[7px] text-ink/40 mt-0.5 leading-snug">{seg.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] md:text-[8px] font-semibold uppercase tracking-widest text-ink/40">Isi Pesan Promo</label>
                  <span className={cn('text-[10px] md:text-[7px]', message.length > 900 ? 'text-rose font-bold' : 'text-ink/30')}>{message.length}/1024</span>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ketik pesan promo di sini... Pesan akan dikirim menggunakan template yang sudah di-approve Meta."
                  rows={5}
                  className="w-full px-3 py-2.5 border border-ink/10 rounded-sm text-sm md:text-[11px] focus:outline-none focus:border-rose/40 transition-colors resize-none"
                />
                <p className="text-[10px] md:text-[7px] text-ink/30 mt-1">
                  Pesan menggunakan template WhatsApp Business. Pastikan template sudah di-approve di Meta Business Console.
                </p>
              </div>

              {/* Preview */}
              <div className="bg-ink/5 rounded-sm p-3">
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-2">Preview:</p>
                <div className="bg-emerald-500/10 border border-emerald-200/50 rounded-lg p-3 max-w-[200px]">
                  <p className="text-[11px] md:text-[8px] font-semibold text-emerald-700">NINOC STUDIO</p>
                  <p className="text-xs md:text-[9px] text-ink/70 mt-1 leading-relaxed">
                    Halo {segment === 'all' ? 'Pelanggan' : segment === 'has_order' ? 'Customer Setia' : 'Customer Baru'}! 👋
                  </p>
                  <p className="text-xs md:text-[9px] text-ink/70 mt-1 leading-relaxed">
                    {message || '[Ketik pesan promo di atas...]'}
                  </p>
                  <p className="text-[11px] md:text-[8px] text-ink/40 mt-2 italic">NINOC STUDIO — Kirim via WhatsApp</p>
                </div>
              </div>

              {/* Error / Success */}
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm">
                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  <p className="text-xs md:text-[9px] text-red-600">{submitError}</p>
                </div>
              )}
              {submitSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-sm">
                  <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                  <p className="text-xs md:text-[9px] text-emerald-700">{submitSuccess}</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs md:text-[9px] font-semibold uppercase tracking-wider text-ink/40 hover:text-ink transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-rose text-white rounded-sm text-xs md:text-[9px] font-bold uppercase tracking-wider hover:bg-rose/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                  {submitting ? 'Mengirim...' : 'Mulai Broadcast'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Campaign History ─── */}
      <div className="flex-1 overflow-y-auto minimal-scroll space-y-3">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
            <MessageSquare size={36} strokeWidth={0.8} />
            <p className="text-xs md:text-[9px] font-medium uppercase tracking-[0.3em] italic">Belum ada campaign broadcast</p>
          </div>
        ) : (
          sessions.map((session, idx) => {
            const progress = session.total_recipients > 0
              ? Math.round((session.total_sent / session.total_recipients) * 100)
              : 0;
            const isActive = session.status === 'queued' || session.status === 'processing';

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  'bg-white border rounded-sm overflow-hidden',
                  isActive ? 'border-amber-200' : 'border-ink/5'
                )}
              >
                {/* Card header */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-ink truncate">{session.name}</p>
                      <StatusBadge status={session.status} />
                    </div>
                    <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest">
                      {SEGMENTS.find(s => s.value === session.segment)?.label || session.segment} • {session.total_recipients} penerima
                    </p>
                    <p className="text-[10px] md:text-[7px] text-ink/20 mt-0.5 italic">
                      {new Date(session.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[14px] font-display italic font-bold text-emerald-500">{session.total_sent}</p>
                    <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest">terkirim</p>
                    {session.total_failed > 0 && (
                      <p className="text-[11px] md:text-[8px] text-red-400 font-semibold">{session.total_failed} gagal</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {isActive && (
                  <div className="px-4 pb-3">
                    <div className="flex justify-between text-[10px] md:text-[7px] text-amber-500 font-semibold uppercase tracking-widest mb-1">
                      <span>Sedang diproses...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-amber-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Play size={8} className="text-amber-400" />
                      <p className="text-[10px] md:text-[7px] text-amber-400/60">Queue processor aktif — cron berjalan setiap 1 menit</p>
                    </div>
                  </div>
                )}

                {/* Message preview */}
                {session.template_message && (
                  <div className="px-4 pb-4">
                    <div className="bg-ink/[0.02] border border-ink/5 rounded-sm p-2.5">
                      <p className="text-[11px] md:text-[8px] text-ink/40 uppercase tracking-widest font-semibold mb-1">Isi Pesan:</p>
                      <p className="text-xs md:text-[9px] text-ink/60 leading-relaxed line-clamp-2">{session.template_message}</p>
                    </div>
                  </div>
                )}

                {/* Done state */}
                {session.status === 'completed' && (
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <CheckCircle size={9} className="text-emerald-400" />
                    <p className="text-[10px] md:text-[7px] text-emerald-400/60 uppercase tracking-widest font-semibold">
                      Selesai {session.completed_at ? new Date(session.completed_at).toLocaleString('id-ID') : ''}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
