import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, ChevronDown, Box, X,
  Package, CreditCard, Truck, Clock, User, Hash, AlertTriangle,
  CheckCircle, XCircle, ArrowLeft, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReturnRequest, ReturnStatus } from '../types';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

const STATUS_CONFIG: Record<ReturnStatus, { label: string; bg: string; text: string }> = {
  requested: { label: 'Requested', bg: 'bg-amber-50', text: 'text-amber-600' },
  approved: { label: 'Approved', bg: 'bg-blue-50', text: 'text-blue-600' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-600' },
  received: { label: 'Received', bg: 'bg-purple-50', text: 'text-purple-600' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'requested', label: 'Requested' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'received', label: 'Received' },
  { id: 'completed', label: 'Completed' },
];

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  refund: { label: 'Refund', color: 'text-blue-600' },
  exchange: { label: 'Exchange', color: 'text-purple-600' },
};

function StatusBadge({ status }: { status: ReturnStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-block px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest rounded-sm", cfg.bg, cfg.text)}>
      {cfg.label}
    </span>
  );
}

export function ReturnsTab() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{ id: string; notes: string } | null>(null);
  const [dispositionModal, setDispositionModal] = useState<{ id: string; items: any[]; orderItems: any[]; dispositions: Record<string, 'restock' | 'reject_defect'> } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filter !== 'all' ? `/api/returns?status=${filter}` : '/api/returns';
      const res = await fetch(url);
      const data = await res.json();
      if (data.returns) setReturns(data.returns);
    } catch (err) {
      console.error('[ReturnsTab] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    queueMicrotask(() => { fetchReturns(); });
  }, [fetchReturns]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin_returns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_returns' }, () => {
        fetchReturns();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchReturns]);

  const handleStatusUpdate = async (id: string, status: ReturnStatus, adminNotes?: string, dispositions?: {return_item_id: string, disposition: string}[]) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes, dispositions }),
      });
      if (!res.ok) throw new Error('Update failed');
      await fetchReturns();
      setExpandedId(null);
    } catch (err) {
      console.error('[ReturnsTab] status update error:', err);
      alert('Gagal update status retur');
    } finally {
      setActionLoading(null);
      setNotesModal(null);
      setDispositionModal(null);
    }
  };

  const filtered = returns.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    const orderId = (r.order_id || '').toLowerCase();
    const name = ((r as any).order?.customer?.full_name || '').toLowerCase();
    const returnId = r.id.toLowerCase();
    return orderId.includes(q) || name.includes(q) || returnId.includes(q);
  });

  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.id] = tab.id === 'all'
      ? returns.length
      : returns.filter(r => r.status === tab.id).length;
    return acc;
  }, {} as Record<string, number>);

  const pendingCount = returns.filter(r => r.status === 'requested').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-medium text-ink uppercase tracking-tight">Retur</h2>
          <p className="text-[10px] text-ink/80 uppercase tracking-widest mt-1">
            {pendingCount > 0 ? `${pendingCount} request pending` : 'Manage product returns and refunds'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto no-scrollbar shrink-0">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors",
              filter === tab.id
                ? "bg-ink text-white"
                : "bg-ink/5 text-ink/90 hover:bg-ink/10 hover:text-ink"
            )}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={cn(
                "ml-1.5 px-1 py-0.5 text-[10px] md:text-[7px] rounded-sm",
                filter === tab.id ? "bg-white/20 text-white" : "bg-rose/10 text-rose"
              )}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/90" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Order ID or Customer name..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-ink/10 text-xs md:text-[11px] focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/80 rounded-sm"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto minimal-scroll bg-white border border-ink/5">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw size={24} className="text-ink/80 mx-auto mb-3" />
            <p className="text-[10px] uppercase tracking-widest text-ink/80">No return requests</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-ink/[0.02] sticky top-0 z-10">
              <tr>
                <th className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-b border-ink/5">ID</th>
                <th className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-b border-ink/5">Date</th>
                <th className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-b border-ink/5">Customer</th>
                <th className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-b border-ink/5">Type</th>
                <th className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-b border-ink/5">Status</th>
                <th className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-b border-ink/5 text-right">Amount</th>
                <th className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-b border-ink/5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ret) => {
                const order = (ret as any).order;
                const customerName = order?.customer?.full_name || 'Unknown';
                const orderTotal = order?.total_price || 0;
                const orderItems = order?.order_items || [];
                const isExpanded = expandedId === ret.id;
                const isLoadingAction = actionLoading === ret.id;

                return (
                  <React.Fragment key={ret.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : ret.id)}
                      className="border-b border-ink/5 hover:bg-ink/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="px-2 py-2">
                        <span className="text-[9px] font-mono bg-ink/5 px-1.5 py-0.5">{ret.id.slice(0, 8)}…</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-[10px] text-ink/80">
                          {new Date(ret.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div>
                          <p className="text-[10px] font-medium text-ink">{customerName}</p>
                          <p className="text-[9px] text-ink/80">{order?.customer?.phone || ''}</p>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <span className={cn("text-[9px] font-semibold uppercase tracking-wider", TYPE_CONFIG[ret.type]?.color || 'text-ink/90')}>
                          {TYPE_CONFIG[ret.type]?.label || ret.type}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge status={ret.status} />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="text-[10px] font-medium text-rose">
                          {orderTotal > 0 ? `IDR ${orderTotal.toLocaleString('id-ID')}` : '-'}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-ink/90 group-hover:text-ink"
                        >
                          <ChevronDown size={12} />
                        </motion.div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-0 py-0 border-b border-rose/20 bg-rose/[0.02]">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-2">

                              {/* Order Items */}
                              <div className="space-y-2">
                                <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/80">Items Returned</p>
                                {orderItems.length > 0 ? orderItems.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-3 p-2 bg-white border border-ink/5">
                                    <div className="w-8 h-8 bg-ink/5 flex items-center justify-center shrink-0">
                                      <Package size={12} className="text-ink/80" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-medium text-ink">{item.product_name}</p>
                                      <p className="text-[9px] text-ink/80">Qty: {item.quantity} · IDR {item.price_at_purchase.toLocaleString('id-ID')}</p>
                                    </div>
                                  </div>
                                )) : (
                                  <p className="text-[9px] text-ink/80 italic">No items</p>
                                )}
                              </div>

                              {/* Reason & Notes */}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/80 mb-1">Reason</p>
                                  <p className="text-[10px] text-ink leading-relaxed bg-white border border-ink/5 p-2">{ret.reason}</p>
                                </div>
                                {ret.admin_notes && (
                                  <div>
                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/80 mb-1">Admin Notes</p>
                                    <p className="text-[10px] text-ink/90 bg-ink/5 p-2">{ret.admin_notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="space-y-2">
                                <p className="text-[9px] font-semibold uppercase tracking-widest text-ink/80">Actions</p>
                                <div className="flex flex-col gap-1.5">
                                  {ret.status === 'requested' && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ret.id, 'approved'); }}
                                        disabled={isLoadingAction}
                                        className="w-full py-2 text-[9px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                      >
                                        {isLoadingAction ? 'Processing...' : '✓ Approve'}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setNotesModal({ id: ret.id, notes: '' }); }}
                                        disabled={isLoadingAction}
                                        className="w-full py-2 text-[9px] font-semibold uppercase tracking-wider bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                      >
                                        ✗ Reject
                                      </button>
                                    </>
                                  )}
                                  {ret.status === 'approved' && (
                                    <button
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setDispositionModal({
                                          id: ret.id,
                                          items: ret.items || [],
                                          orderItems: orderItems,
                                          dispositions: {}
                                        });
                                      }}
                                      disabled={isLoadingAction}
                                      className="w-full py-2 text-[9px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50"
                                    >
                                      {isLoadingAction ? 'Processing...' : 'Mark Received'}
                                    </button>
                                  )}
                                  {ret.status === 'received' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ret.id, 'completed'); }}
                                      disabled={isLoadingAction}
                                      className="w-full py-2 text-[9px] font-semibold uppercase tracking-wider bg-ink text-white hover:bg-rose transition-colors disabled:opacity-50"
                                    >
                                      {isLoadingAction ? 'Processing...' : '✓ Mark Completed'}
                                    </button>
                                  )}
                                  {(ret.status === 'rejected' || ret.status === 'completed') && (
                                    <p className="text-[9px] text-ink/80 italic uppercase tracking-wider text-center py-2">
                                      {ret.status === 'rejected' ? 'Retur ditolak' : 'Selesai'}
                                    </p>
                                  )}
                                </div>
                                <p className="text-[9px] text-ink/90 italic">
                                  Order: <span className="font-mono">{ret.order_id.slice(0, 12)}…</span>
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Notes Modal */}
      {notesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setNotesModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white w-full max-w-sm rounded-sm shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-2 border-b border-ink/5 flex items-center justify-between">
              <h3 className="text-xs md:text-[11px] font-semibold uppercase tracking-widest text-ink">Reject Return</h3>
              <button onClick={() => setNotesModal(null)} className="text-ink/90 hover:text-rose"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-widest text-ink/80 block mb-1.5">Reason for rejection</label>
                <textarea
                  autoFocus
                  value={notesModal.notes}
                  onChange={e => setNotesModal({ ...notesModal, notes: e.target.value })}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full px-1.5 py-1 border border-ink/10 text-xs md:text-[11px] focus:outline-none focus:border-rose/40 resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-2 border-t border-ink/5 flex items-center justify-end gap-2">
              <button onClick={() => setNotesModal(null)} className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-ink/90 hover:text-ink">Cancel</button>
              <button
                onClick={() => handleStatusUpdate(notesModal.id, 'rejected', notesModal.notes)}
                className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600"
              >
                Confirm Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Disposition Modal */}
      {dispositionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setDispositionModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-5 py-2 border-b border-ink/5 flex items-center justify-between shrink-0">
              <h3 className="text-xs md:text-[11px] font-semibold uppercase tracking-widest text-ink">Kondisi Barang Retur</h3>
              <button onClick={() => setDispositionModal(null)} className="text-ink/90 hover:text-rose"><X size={14} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto minimal-scroll space-y-2">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-sm text-xs mb-4">
                <p className="font-semibold uppercase tracking-widest text-[9px] mb-1">Perhatian</p>
                <p>Tentukan apakah barang ini masih bisa dijual kembali (Restock) atau masuk ke Gudang Reject (Cacat).</p>
              </div>

              {dispositionModal.items.map((rItem, idx) => {
                const oItem = dispositionModal.orderItems.find(oi => oi.id === rItem.order_item_id);
                const currentDisp = dispositionModal.dispositions[rItem.id];
                
                return (
                  <div key={rItem.id} className="border border-ink/10 p-3 rounded-sm">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 bg-ink/5 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-ink/80" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink">{oItem?.product_name || 'Unknown Item'}</p>
                        <p className="text-xs text-ink/90">Qty Diretur: <strong>{rItem.quantity}</strong></p>
                        {rItem.reason && <p className="text-[10px] text-ink/80 mt-1 italic">Alasan Konsumen: &quot;{rItem.reason}&quot;</p>}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDispositionModal(prev => prev ? { ...prev, dispositions: { ...prev.dispositions, [rItem.id]: 'restock' } } : null)}
                        className={cn(
                          "flex-1 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors rounded-sm",
                          currentDisp === 'restock' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-ink/10 text-ink/80 hover:border-emerald-300 hover:bg-emerald-50/50"
                        )}
                      >
                        ✅ Bagus (Restock)
                      </button>
                      <button
                        onClick={() => setDispositionModal(prev => prev ? { ...prev, dispositions: { ...prev.dispositions, [rItem.id]: 'reject_defect' } } : null)}
                        className={cn(
                          "flex-1 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors rounded-sm",
                          currentDisp === 'reject_defect' ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-ink/10 text-ink/80 hover:border-red-300 hover:bg-red-50/50"
                        )}
                      >
                        ❌ Cacat (Reject)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-2 border-t border-ink/5 flex items-center justify-end gap-2 shrink-0 bg-ink/[0.02]">
              <button onClick={() => setDispositionModal(null)} className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-ink/90 hover:text-ink">Batal</button>
              <button
                disabled={Object.keys(dispositionModal.dispositions).length !== dispositionModal.items.length || actionLoading === dispositionModal.id}
                onClick={() => {
                  const arr = Object.entries(dispositionModal.dispositions).map(([k, v]) => ({ return_item_id: k, disposition: v }));
                  handleStatusUpdate(dispositionModal.id, 'received', undefined, arr);
                }}
                className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-ink text-white hover:bg-rose transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === dispositionModal.id ? 'Memproses...' : 'Konfirmasi Penerimaan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
