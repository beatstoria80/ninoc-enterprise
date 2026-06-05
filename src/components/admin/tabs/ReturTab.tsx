"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  RefreshCw, Check, X, AlertCircle, Clock, Video,
  Eye, Search, CheckCircle, XCircle, Package
} from 'lucide-react';
import Link from 'next/link';

interface ReturRequest {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  order_id: string;
  ticket_id: string | null;
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
  resolved_by: string | null;
  user?: { id: string; email?: string; raw_user_meta_data?: { full_name?: string } };
}

const STATUS_OPTS = ['all', 'pending', 'reviewed', 'approved', 'rejected', 'completed'];

const STATUS_CONFIG: Record<string, { label: string; labelID: string; color: string; badge: string; text: string }> = {
  pending:   { label: 'Pending', labelID: 'Pending Review', color: 'bg-amber-50 border-amber-200 text-amber-600', badge: 'bg-amber-400', text: 'text-amber-600' },
  reviewed:  { label: 'Reviewed', labelID: 'Sedang Dicek', color: 'bg-blue-50 border-blue-200 text-blue-600', badge: 'bg-blue-400', text: 'text-blue-600' },
  approved:  { label: 'Approved', labelID: 'Disetujui', color: 'bg-emerald-50 border-emerald-200 text-emerald-600', badge: 'bg-emerald-400', text: 'text-emerald-600' },
  rejected:  { label: 'Rejected', labelID: 'Ditolak', color: 'bg-red-50 border-red-200 text-red-600', badge: 'bg-red-400', text: 'text-red-600' },
  completed: { label: 'Completed', labelID: 'Selesai', color: 'bg-gray-50 border-gray-200 text-gray-500', badge: 'bg-gray-400', text: 'text-gray-500' },
  cancelled: { label: 'Cancelled', labelID: 'Dibatalkan', color: 'bg-gray-50 border-gray-200 text-gray-400', badge: 'bg-gray-300', text: 'text-gray-300' },
};

const TIMELINE = [
  { key: 'pending', label: 'Diajukan', icon: Clock },
  { key: 'reviewed', label: 'Dicek', icon: Eye },
  { key: 'approved', label: 'Disetujui', icon: CheckCircle },
  { key: 'rejected', label: 'Ditolak', icon: XCircle },
  { key: 'completed', label: 'Selesai', icon: Check },
];

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function formatPrice(n: number) {
  return `IDR ${n.toLocaleString('id-ID')}`;
}

function ReturDetail({ retur, onClose, onRefresh }: {
  retur: ReturRequest;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [status, setStatus] = useState(retur.status);
  const [adminNotes, setAdminNotes] = useState(retur.admin_notes || '');
  const [refundAmount, setRefundAmount] = useState(retur.refund_amount?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const statusIdx = TIMELINE.findIndex(s => s.key === status);

  const handleAction = async (newStatus: string, note?: string) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (note !== undefined) body.admin_notes = note;
      if (newStatus === 'approved' && refundAmount) {
        body.refund_amount = parseInt(refundAmount) || 0;
        body.refund_method = 'transfer';
      }
      const res = await fetch(`/api/retur/${retur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus(newStatus as ReturRequest['status']);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onRefresh();
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await fetch(`/api/retur/${retur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      setNotifyMsg('Note tersimpan');
      setTimeout(() => setNotifyMsg(''), 2000);
    } catch {
      setNotifyMsg('Gagal menyimpan');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-ink/5 bg-white shrink-0 flex items-center gap-3">
        <span className={cn('px-2 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-sm', cfg.color)}>
          {cfg.labelID}
        </span>
        {retur.fraud_suspected && (
          <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 rounded-sm flex items-center gap-1">
            <AlertCircle size={9} /> Fraud
          </span>
        )}
        {retur.guest_email && (
          <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 rounded-sm flex items-center gap-1">
            Guest
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {saved && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-emerald-500 font-semibold">
              Tersimpan!
            </motion.span>
          )}
          <button onClick={onClose} className="text-[8px] text-rose uppercase tracking-wider font-semibold hover:underline">
            Tutup
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto minimal-scroll p-4 space-y-4">

        {/* Timeline */}
        <div className="bg-white border border-ink/5 rounded-sm p-4">
          <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-3">Status Timeline</p>
          <div className="flex items-center gap-0">
            {TIMELINE.map((step, i) => {
              const Icon = step.icon;
              const isDone = i < statusIdx;
              const isCurrent = i === statusIdx;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-7 h-7 rounded-sm flex items-center justify-center border transition-colors',
                      isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                      isCurrent ? cfg.color + ' border' :
                      'bg-ink/5 border-ink/10 text-ink/20'
                    )}>
                      {isDone ? <Check size={11} strokeWidth={2.5} /> : <Icon size={11} strokeWidth={1.5} />}
                    </div>
                    <p className={cn('text-[6px] font-medium uppercase tracking-widest mt-1.5 text-center',
                      isDone || isCurrent ? 'text-ink/70' : 'text-ink/20'
                    )}>{step.label}</p>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className={cn('flex-1 h-px mx-0.5 mb-4', i < statusIdx ? 'bg-emerald-300' : 'bg-ink/5')} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white border border-ink/5 rounded-sm p-4 space-y-2">
          <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Customer</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ink text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
              {(retur.user?.raw_user_meta_data?.full_name || retur.user?.email || retur.guest_email || 'G')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink">
                {retur.user?.raw_user_meta_data?.full_name || retur.guest_email || 'Guest'}
              </p>
              <p className="text-[9px] text-ink/40">{retur.user?.email || retur.guest_email || 'No email'}</p>
            </div>
            {retur.guest_email && (
              <span className="ml-auto px-2 py-1 bg-amber-50 text-amber-600 text-[7px] font-bold uppercase tracking-widest border border-amber-100 rounded-sm">
                GUEST
              </span>
            )}
          </div>
        </div>

        {/* Order & Reason */}
        <div className="bg-white border border-ink/5 rounded-sm p-4 space-y-3">
          <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Detail</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Order ID</p>
              <p className="text-[11px] font-semibold text-ink font-mono">{retur.order_id}</p>
            </div>
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Diajukan</p>
              <p className="text-[9px] text-ink/60">{formatDate(retur.created_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Alasan</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-rose/10 text-rose text-[8px] font-bold uppercase tracking-widest rounded-sm">{retur.reason_label}</span>
              <span className="text-[7px] text-ink/20 font-mono">{retur.reason}</span>
            </div>
          </div>
          {retur.description && (
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Deskripsi</p>
              <p className="text-[9px] text-ink/60 leading-relaxed">{retur.description}</p>
            </div>
          )}
        </div>

        {/* Video Evidence */}
        {retur.video_url && (
          <div className="bg-white border border-ink/5 rounded-sm overflow-hidden">
            <div className="px-4 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video size={12} className="text-ink/30" />
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Bukti Video Unboxing</p>
                {retur.video_duration_seconds && (
                  <span className="text-[7px] text-ink/20">{retur.video_duration_seconds}s · 1-shot</span>
                )}
              </div>
              {retur.fraud_suspected && (
                <span className="px-2 py-1 bg-red-50 text-red-500 text-[7px] font-bold uppercase tracking-widest border border-red-100 rounded-sm">Fraud Flagged</span>
              )}
            </div>
            <video
              src={retur.video_url}
              controls
              preload="metadata"
              className="w-full aspect-video bg-black mt-2"
            />
            {retur.fraud_reasons && retur.fraud_reasons.length > 0 && (
              <div className="px-4 pb-3 pt-2 space-y-1">
                {retur.fraud_reasons.map((r, i) => (
                  <p key={i} className="text-[8px] text-red-400 flex items-start gap-1">
                    <AlertCircle size={9} className="shrink-0 mt-0.5" />{r}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Notes */}
        <div className="bg-white border border-ink/5 rounded-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Catatan Internal</p>
            {notifyMsg && <span className="text-[8px] text-emerald-500 font-semibold">{notifyMsg}</span>}
          </div>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Catatan internal — tidak terlihat customer..."
            className="w-full px-3 py-2 text-[9px] border border-ink/5 rounded-sm outline-none focus:border-rose/40 resize-none placeholder:text-ink/15 bg-ink/[0.01]"
          />
          <div className="flex items-center justify-between">
            <p className="text-[7px] text-ink/20 italic">Tidak terlihat oleh customer</p>
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="px-3 py-1.5 bg-ink text-white text-[8px] font-semibold uppercase tracking-wider rounded-sm hover:bg-rose transition-colors disabled:opacity-50"
            >
              {savingNote ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </div>
        </div>

        {/* Refund Amount */}
        {['pending', 'reviewed'].includes(status) && (
          <div className="bg-white border border-ink/5 rounded-sm p-4 space-y-2">
            <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Jumlah Refund</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink/40 font-semibold">IDR</span>
              <input
                type="number"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder="0"
                className="flex-1 text-[13px] font-display italic font-bold text-rose outline-none border-b border-ink/10 focus:border-rose/40 bg-transparent"
              />
            </div>
          </div>
        )}

        {/* Approved Refund Display */}
        {status === 'approved' && retur.refund_amount && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-4">
            <p className="text-[7px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">Refund Disetujui</p>
            <p className="text-[18px] font-display italic font-bold text-emerald-700">{formatPrice(retur.refund_amount)}</p>
          </div>
        )}

        {/* Resolved At */}
        {retur.resolved_at && (
          <div className="text-[8px] text-ink/30 text-center">
            Diselesaikan pada {formatDate(retur.resolved_at)}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-ink/5 bg-white shrink-0">
        {['pending', 'reviewed'].includes(status) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('rejected')}
              disabled={saving}
              className="flex-1 py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 rounded-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <X size={11} /> Tolak
            </button>
            <button
              onClick={() => handleAction('reviewed')}
              disabled={saving}
              className="flex-1 py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 rounded-sm hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Eye size={11} /> Review
            </button>
            <button
              onClick={() => handleAction('approved')}
              disabled={saving}
              className="flex-1 py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-emerald-500 text-white rounded-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={11} />}
              Setujui
            </button>
          </div>
        )}
        {status === 'approved' && (
          <button
            onClick={() => handleAction('completed')}
            disabled={saving}
            className="w-full py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-ink text-white rounded-sm hover:bg-rose transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={11} />}
            Tandai Selesai
          </button>
        )}
        {(status === 'rejected' || status === 'completed') && (
          <p className="text-center text-[8px] text-ink/30 uppercase tracking-wider">
            Retur ini sudah {status === 'rejected' ? 'ditolak' : 'selesai'}
          </p>
        )}
      </div>
    </div>
  );
}

export function ReturTab() {
  const [returs, setReturs] = useState<ReturRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReturRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchReturs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/retur?${params}`);
      const data = await res.json();
      setReturs(data.retur_requests || []);
    } catch (err) {
      console.error('[ReturTab] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    queueMicrotask(() => { fetchReturs(); });
  }, [fetchReturs]);

  const filtered = returs.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.order_id.toLowerCase().includes(q) ||
      r.reason_label.toLowerCase().includes(q) ||
      r.guest_email?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.user?.raw_user_meta_data?.full_name?.toLowerCase().includes(q)
    );
  });

  const pendingCount = returs.filter(r => r.status === 'pending').length;
  const reviewedCount = returs.filter(r => r.status === 'reviewed').length;
  const approvedCount = returs.filter(r => r.status === 'approved').length;
  const rejectedCount = returs.filter(r => r.status === 'rejected').length;

  return (
    <div className="flex h-full bg-gray-50/50">
      {/* Left Panel — List */}
      <div className="w-[280px] flex flex-col shrink-0 border-r border-ink/5 bg-white">
        <div className="p-3 space-y-2 shrink-0 border-b border-ink/5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-rose/10 rounded-sm flex items-center justify-center">
                <RefreshCw size={13} className="text-rose" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-ink uppercase tracking-wider">Retur</p>
                <p className="text-[7px] text-ink/30 uppercase tracking-widest">Request Manager</p>
              </div>
            </div>
            <button
              onClick={fetchReturs}
              className="w-6 h-6 flex items-center justify-center text-ink/30 hover:text-rose transition-colors"
            >
              <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex gap-1">
            {[
              { count: pendingCount, label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-100' },
              { count: reviewedCount, label: 'Reviewed', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { count: approvedCount, label: 'Approved', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { count: rejectedCount, label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-100' },
            ].map(({ count, label, color }) => count > 0 && (
              <div key={label} className={cn('px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest rounded-sm border', color)}>
                {count} {label}
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/20" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Order ID / Email / Nama..."
              className="w-full pl-7 pr-3 py-2 bg-ink/[0.02] border border-ink/5 text-[9px] outline-none focus:border-rose/30 placeholder:text-ink/15 rounded-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-2 py-1 text-[7px] font-semibold uppercase tracking-wider rounded-sm transition-colors',
                  statusFilter === s
                    ? 'bg-rose text-white'
                    : 'bg-ink/5 text-ink/40 hover:bg-ink/10'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto minimal-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-rose/20 border-t-rose rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Package size={20} className="text-ink/10 mx-auto mb-2" strokeWidth={1} />
              <p className="text-[8px] uppercase tracking-widest text-ink/20">Belum ada request</p>
            </div>
          ) : (
            filtered.map(r => {
              const cfg = STATUS_CONFIG[r.status];
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={cn(
                    'w-full p-3 text-left border-b border-ink/5 transition-colors',
                    selected?.id === r.id ? 'bg-rose/[0.04] border-l-2 border-l-rose' : 'hover:bg-ink/[0.01]'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn('w-2 h-2 rounded-sm shrink-0', cfg?.badge || 'bg-gray-300')} />
                    <span className="text-[9px] font-semibold text-ink uppercase tracking-wider flex-1 truncate font-mono">{r.order_id}</span>
                    {r.fraud_suspected && <AlertCircle size={10} className="text-red-500 shrink-0" />}
                    {r.guest_email && <span className="px-1 py-0.5 bg-amber-50 text-amber-600 text-[6px] font-bold uppercase rounded-sm shrink-0">G</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-ink/30 truncate">{r.reason_label}</span>
                    <span className="text-[7px] text-ink/20 shrink-0 ml-2">
                      {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  {r.guest_email && (
                    <p className="text-[7px] text-amber-600 mt-0.5 truncate">{r.guest_email}</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel — Detail */}
      <div className="flex-1 bg-gray-50/50">
        {selected ? (
          <ReturDetail
            retur={selected}
            onClose={() => setSelected(null)}
            onRefresh={fetchReturs}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 border border-dashed border-ink/10 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw size={22} className="text-ink/10" strokeWidth={1} />
              </div>
              <p className="text-[9px] uppercase tracking-widest text-ink/20">Pilih request untuk melihat detail</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
