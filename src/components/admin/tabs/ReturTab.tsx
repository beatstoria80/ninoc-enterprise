"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  RefreshCw, Check, X, AlertCircle, Clock, Video, MessageSquare,
  ChevronRight, Eye, Filter, Search, ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface ReturRequest {
  id: string;
  user_id: string | null;
  order_id: string;
  ticket_id: string | null;
  reason: string;
  reason_label: string;
  description: string | null;
  video_url: string | null;
  video_duration_seconds: number | null;
  status: string;
  fraud_suspected: boolean | null;
  fraud_reasons: string[] | null;
  admin_notes: string | null;
  refund_amount: number | null;
  refund_method: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; email?: string; raw_user_meta_data?: { full_name?: string } };
}

const STATUS_OPTS = ['all', 'pending', 'approved', 'rejected', 'completed', 'reviewed'];
const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string; text: string }> = {
  pending:   { label: 'Pending', color: 'bg-amber-50 border-amber-200 text-amber-600', badge: 'bg-amber-500', text: 'text-amber-600' },
  reviewed:  { label: 'Reviewed',  color: 'bg-blue-50 border-blue-200 text-blue-600', badge: 'bg-blue-500', text: 'text-blue-500' },
  approved:  { label: 'Approved', color: 'bg-emerald-50 border-emerald-200 text-emerald-600', badge: 'bg-emerald-500', text: 'text-emerald-600' },
  rejected:  { label: 'Rejected', color: 'bg-red-50 border-red-200 text-red-600', badge: 'bg-red-500', text: 'text-red-600' },
  completed: { label: 'Completed', color: 'bg-gray-50 border-gray-200 text-gray-500', badge: 'bg-gray-400', text: 'text-gray-500' },
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatPrice(n: number) {
  return `IDR ${n.toLocaleString('id-ID')}`;
}

function ReturDetail({ retur, onClose, onRefresh }: { retur: ReturRequest; onClose: () => void; onRefresh: () => void }) {
  const [status, setStatus] = useState(retur.status);
  const [adminNotes, setAdminNotes] = useState(retur.admin_notes || '');
  const [refundAmount, setRefundAmount] = useState(retur.refund_amount?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const cfg = STATUS_CONFIG[status];

  const handleAction = async (newStatus: string, notes?: string) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (notes !== undefined) body.admin_notes = notes;
      if (newStatus === 'approved' && refundAmount) {
        body.refund_amount = parseInt(refundAmount) || 0;
        body.refund_method = 'transfer';
      }
      await fetch(`/api/retur/${retur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setStatus(newStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch (err) {
      console.error('[ReturTab] action error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* Detail panel header */}
      <div className="px-4 py-3 border-b border-ink/5 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-sm', cfg?.color)}>
            {cfg?.label}
          </span>
          {retur.fraud_suspected && (
            <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 rounded-sm flex items-center gap-1">
              <AlertCircle size={9} /> Fraud?
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-emerald-500 font-semibold">
              Saved!
          </motion.span>
          )}
          <Link
            href="/admin"
            className="text-[8px] text-rose uppercase tracking-wider font-semibold"
          >Close</Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto minimal-scroll p-4 space-y-4">
        {/* Customer info */}
        <div className="bg-white border border-ink/5 p-3 space-y-2">
          <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Customer</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ink text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
              {(retur.user?.raw_user_meta_data?.full_name || retur.user?.email || 'G')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ink">{retur.user?.raw_user_meta_data?.full_name || 'Guest User'}</p>
              <p className="text-[8px] text-ink/30">{retur.user?.email || 'No email'}</p>
            </div>
          </div>
        </div>

        {/* Order & Reason */}
        <div className="bg-white border border-ink/5 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Order ID</p>
              <p className="text-[11px] font-semibold text-ink">{retur.order_id}</p>
            </div>
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Submitted</p>
              <p className="text-[9px] text-ink/60">{formatDate(retur.created_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Reason</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-rose/10 text-rose text-[8px] font-bold uppercase tracking-widest rounded-sm">{retur.reason_label}</span>
              <span className="text-[8px] text-ink/20 font-mono">{retur.reason}</span>
            </div>
          </div>
          {retur.description && (
            <div>
              <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Description</p>
              <p className="text-[9px] text-ink/60 leading-relaxed">{retur.description}</p>
            </div>
          )}
        </div>

        {/* Video Evidence */}
        {retur.video_url && (
          <div className="bg-white border border-ink/5 overflow-hidden">
            <div className="px-3 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Unboxing Video</p>
                {retur.video_duration_seconds && (
                  <span className="text-[7px] text-ink/20">{retur.video_duration_seconds}s</span>
                )}
              </div>
              {retur.fraud_suspected && (
                <span className="px-2 py-1 bg-red-50 text-red-500 text-[7px] font-bold uppercase tracking-wider border border-red-100 rounded-sm">Fraud Flagged</span>
              )}
            </div>
            <video
              src={retur.video_url}
              controls
              preload="metadata"
              className="w-full aspect-video bg-black mt-2"
            />
            {retur.fraud_reasons && retur.fraud_reasons.length > 0 && (
              <div className="px-3 pb-3 pt-2 space-y-1">
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
        <div className="bg-white border border-ink/5 p-3 space-y-2">
          <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Admin Notes</p>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Catatan internal..."
            className="w-full px-3 py-2 text-[9px] border border-ink/5 rounded-sm outline-none focus:border-rose/40 resize-none placeholder:text-ink/15 bg-ink/[0.01]"
          />
          <p className="text-[7px] text-ink/20 italic">Notes tidak terlihat oleh customer</p>
        </div>

        {/* Refund Amount */}
        {(status === 'pending' || status === 'reviewed') && (
          <div className="bg-white border border-ink/5 p-3 space-y-2">
            <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Refund Amount (Admin Only)</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink/30">IDR</span>
              <input
                type="number"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder="0"
                className="flex-1 text-[11px] font-semibold outline-none border-b border-ink/10 focus:border-rose/40 bg-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(status === 'pending' || status === 'reviewed') && (
        <div className="p-4 border-t border-ink/5 bg-white flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction('rejected', adminNotes)}
            disabled={saving}
            className="flex-1 py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 rounded-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X size={11} /> Reject
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction('reviewed', adminNotes)}
            disabled={saving}
            className="flex-1 py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 rounded-sm hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Eye size={11} /> Review
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction('approved', adminNotes)}
            disabled={saving}
            className="flex-1 py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-emerald-500 text-white rounded-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={11} />
            )}
            Approve
          </motion.button>
        </div>
      )}
      {(status === 'approved' || status === 'completed') && (
        <div className="p-4 border-t border-ink/5 bg-white shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction('completed', adminNotes)}
            className="w-full py-2.5 text-[9px] font-semibold uppercase tracking-widest bg-ink text-white rounded-sm hover:bg-rose transition-colors flex items-center justify-center gap-2"
          >
            <Check size={11} /> Mark Completed
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export function ReturTab() {
  const [returs, setReturs] = useState<ReturRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReturRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');

  const fetchReturs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReturs(); }, [fetchReturs]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (selected) fetchReturs(); }, [fetchReturs, selected]);

  const filtered = returs.filter(r =>
    !search || r.order_id.toLowerCase().includes(search.toLowerCase()) || r.reason_label.toLowerCase().includes(search.toLowerCase())
  );
  const pendingCount = returs.filter(r => r.status === 'pending').length;

  return (
    <div className="flex h-full bg-gray-50/50">
      {/* Left panel — list */}
      <div className="w-[260px] flex flex-col shrink-0 border-r border-ink/5 bg-white">
        <div className="p-3 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-ink uppercase tracking-wide">Retur Requests</h2>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[7px] font-bold uppercase tracking-widest rounded-sm border border-amber-100">
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/20" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari order ID..."
              className="w-full pl-7 pr-3 py-2 bg-ink/[0.02] border border-ink/5 text-[9px] outline-none focus:border-rose/30 placeholder:text-ink/15 rounded-sm"
            />
          </div>
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
        <div className="flex-1 overflow-y-auto minimal-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-rose/20 border-t-rose rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <RefreshCw size={16} className="text-ink/10 mx-auto mb-2" strokeWidth={1} />
              <p className="text-[8px] text-ink/20 uppercase tracking-widest">No requests</p>
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
                    selected?.id === r.id ? 'bg-rose/[0.03] border-l-2 border-l-rose' : 'hover:bg-ink/[0.01]'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg?.badge || 'bg-gray-300')} />
                    <span className="text-[9px] font-semibold text-ink uppercase tracking-wider flex-1 truncate">{r.order_id}</span>
                    {r.fraud_suspected && <AlertCircle size={10} className="text-red-500 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-ink/30">{r.reason_label}</span>
                    <span className="text-[7px] text-ink/20">{new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — detail */}
      <div className="flex-1 bg-gray-50/50">
        {selected ? (
          <ReturDetail
            retur={selected}
            onClose={() => setSelected(null)}
            onRefresh={() => { fetchReturs(); if (selected) setSelected({ ...selected, status: selected.status }); }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <RefreshCw size={24} className="text-ink/10 mx-auto" strokeWidth={1} />
              <p className="text-[9px] uppercase tracking-widest text-ink/20">Pilih request untuk melihat detail</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
