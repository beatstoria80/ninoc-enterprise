"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Clock, CheckCircle, Truck, Package, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { ReturnModal } from '../../../app/profile/orders/[id]/_components/ReturnModal';

interface OrderReturn {
  id: string;
  order_id: string;
  type: 'refund' | 'exchange';
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'completed';
  reason: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  order_items?: { id: string; product_name?: string; size?: string; quantity: number; price_at_purchase: number }[];
}

interface ReturnWithOrder extends OrderReturn {
  order?: Order;
}

const STATUS_FLOW = [
  { key: 'requested', label: 'Diajukan', icon: Clock, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { key: 'approved', label: 'Disetujui', icon: CheckCircle, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { key: 'rejected', label: 'Ditolak', icon: XCircle, color: 'text-red-500 bg-red-50 border-red-200' },
  { key: 'received', label: 'Diterima', icon: Package, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  { key: 'completed', label: 'Selesai', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
];

const TYPE_CONFIG = {
  refund: { label: 'Refund', color: 'bg-blue-50 text-blue-600' },
  exchange: { label: 'Exchange', color: 'bg-purple-50 text-purple-600' },
};

const EASING = { out: [0.23, 1, 0.32, 1] } as const;

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnWithOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderDetailModal, setOrderDetailModal] = useState<{ order: Order; items: Order['order_items'] } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: returnData } = await supabase
        .from('order_returns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!returnData) { setIsLoading(false); return; }

      // Fetch orders for each return
      const ordersMap = await Promise.all(
        returnData.map(async (ret) => {
          const { data: orderData } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', ret.order_id)
            .single();
          return { ...ret, order: orderData };
        })
      );

      setReturns(ordersMap as ReturnWithOrder[]);
    } catch (err) {
      console.error('[ReturnsPage] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => { fetchReturns(); });
  }, [fetchReturns]);

  const filtered = returns.filter(r => {
    if (filter === 'pending') return ['requested', 'approved', 'received'].includes(r.status);
    if (filter === 'completed') return ['completed', 'rejected'].includes(r.status);
    return true;
  });

  const getStatusIndex = (status: string) => STATUS_FLOW.findIndex(s => s.key === status);

  return (
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white">
      <div className="max-w-[800px] mx-auto px-6 pt-4 md:pt-40 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/profile" className="flex items-center gap-2 text-ink/30 hover:text-ink transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em]">Exit to Profile</span>
          </Link>
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-widest text-ink/30 mb-1">Return & Refund</p>
            <h1 className="text-xl font-display italic font-medium uppercase tracking-tight">Return Tracker</h1>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto no-scrollbar shrink-0">
          {([
            { id: 'all' as const, label: 'All' },
            { id: 'pending' as const, label: 'Active' },
            { id: 'completed' as const, label: 'History' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-4 py-2 text-[9px] font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors",
                filter === tab.id ? "bg-ink text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/10"
              )}
            >
              {tab.label}
              {tab.id === 'pending' && returns.filter(r => ['requested', 'approved', 'received'].includes(r.status)).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[7px] rounded-sm bg-rose/10 text-rose">
                  {returns.filter(r => ['requested', 'approved', 'received'].includes(r.status)).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border border-ink/10 border-t-rose rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-16 h-16 bg-ink/5 rounded-full flex items-center justify-center">
              <RefreshCw size={24} strokeWidth={1} className="text-ink/20" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">No Returns Found</p>
              <p className="text-[9px] text-ink/20 mt-1 italic">Return history will appear here</p>
            </div>
            <Link href="/profile" className="text-[9px] text-rose hover:underline uppercase tracking-widest">
              Browse Orders
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ret, idx) => {
              const statusIdx = getStatusIndex(ret.status);
              const StatusIcon = STATUS_FLOW[statusIdx]?.icon || Clock;
              const statusCfg = STATUS_FLOW[statusIdx];

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
                    {/* Status Icon */}
                    <div className={cn(
                      "w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border",
                      statusCfg?.color || 'bg-ink/5 text-ink/30 border-ink/10'
                    )}>
                      <StatusIcon size={14} strokeWidth={1.5} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest rounded-sm border",
                          TYPE_CONFIG[ret.type]?.color || 'bg-gray-50 text-gray-500 border-gray-200'
                        )}>
                          {TYPE_CONFIG[ret.type]?.label || ret.type}
                        </span>
                        <span className="text-[7px] text-ink/30 font-mono">#{ret.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-[10px] font-medium text-ink uppercase tracking-wider">
                        {ret.order?.order_items?.map(i => i.product_name).filter(Boolean).join(', ') || 'Order Item'}
                      </p>
                      <p className="text-[7px] text-ink/30 mt-0.5 uppercase tracking-tight">
                        {new Date(ret.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-display italic font-medium text-rose">
                        IDR {(ret.order?.total_price || 0).toLocaleString('id-ID')}
                      </p>
                      <p className={cn(
                        "text-[7px] font-semibold uppercase tracking-widest mt-0.5",
                        statusCfg?.color.split(' ')[1] || 'text-ink/30'
                      )}>
                        {statusCfg?.label || ret.status}
                      </p>
                    </div>

                    {/* Expand Icon */}
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

                          {/* Timeline */}
                          <div className="pt-4">
                            <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-3">Status Timeline</p>
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
                                      <div className={cn(
                                        "flex-1 h-px mx-1 mb-4 transition-colors",
                                        i < statusIdx ? "bg-emerald-400" : "bg-ink/5"
                                      )} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="bg-ink/[0.01] border border-ink/5 p-3 rounded-sm">
                            <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1.5">Alasan Retur</p>
                            <p className="text-[10px] text-ink/70 leading-relaxed">{ret.reason}</p>
                          </div>

                          {/* Admin Notes */}
                          {ret.admin_notes && (
                            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-sm">
                              <p className="text-[7px] font-semibold uppercase tracking-widest text-amber-500 mb-1.5">Catatan Admin</p>
                              <p className="text-[10px] text-ink/70 leading-relaxed">{ret.admin_notes}</p>
                            </div>
                          )}

                          {/* Items */}
                          {ret.order?.order_items && ret.order.order_items.length > 0 && (
                            <div>
                              <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-2">Item yang Diretur</p>
                              <div className="space-y-1.5">
                                {ret.order.order_items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 bg-ink/[0.01] border border-ink/5 rounded-sm">
                                    <div className="flex items-center gap-2">
                                      <Package size={10} className="text-ink/30" />
                                      <span className="text-[9px] font-medium text-ink uppercase">{item.product_name}</span>
                                      <span className="text-[7px] text-ink/30">SZ {item.size}</span>
                                      <span className="text-[7px] text-ink/30">×{item.quantity}</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-ink/60">IDR {item.price_at_purchase.toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* View Order Link */}
                          {ret.order && (
                            <Link
                              href={`/profile/orders/${ret.order_id}`}
                              className="flex items-center justify-between p-3 border border-ink/5 rounded-sm hover:border-rose/20 hover:bg-rose/[0.02] transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <Truck size={11} className="text-ink/30 group-hover:text-rose transition-colors" />
                                <span className="text-[9px] font-medium text-ink/50 group-hover:text-rose uppercase tracking-wider transition-colors">View Order Detail</span>
                              </div>
                              <ChevronRight size={10} className="text-ink/20 group-hover:text-rose transition-colors" />
                            </Link>
                          )}

                          {/* Policy Info */}
                          {ret.status !== 'completed' && ret.status !== 'rejected' && (
                            <div className="bg-rose/[0.02] border border-rose/10 p-3 rounded-sm space-y-1">
                              <p className="text-[7px] font-semibold uppercase tracking-widest text-rose/60 mb-1.5">Info Proses Retur</p>
                              <p className="text-[8px] text-ink/40 leading-relaxed flex items-start gap-1.5">
                                <span className="text-rose/40 font-bold shrink-0">•</span>
                                Klaim maksimal 2x24 jam setelah barang diterima (bukti video 1-shot wajib)
                              </p>
                              <p className="text-[8px] text-ink/40 leading-relaxed flex items-start gap-1.5">
                                <span className="text-rose/40 font-bold shrink-0">•</span>
                                Refund diproses 3-5 hari kerja setelah barang diterima
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