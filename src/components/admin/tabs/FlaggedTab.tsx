"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, Eye, X, MessageSquare, AlertTriangle, ShieldAlert,
  ChevronDown, Search, CheckCircle, Clock, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface FlaggedTicket {
  id: string;
  subject: string;
  category: string;
  flagged_reason: string;
  flagged_at: string;
  flagged_severity: 'sara' | 'nsfw';
  created_at: string;
  status: string;
  user_id: string;
}

const SEVERITY_CONFIG = {
  sara: {
    label: 'SARA',
    color: 'text-amber-500 bg-amber-50 border-amber-200',
    icon: AlertTriangle,
  },
  nsfw: {
    label: 'NSFW',
    color: 'text-red-500 bg-red-50 border-red-200',
    icon: ShieldAlert,
  },
};

export function FlaggedTab() {
  const [tickets, setTickets] = useState<FlaggedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchFlagged = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .not('flagged_severity', 'is', null)
        .order('flagged_at', { ascending: false });

      if (data) setTickets(data as FlaggedTicket[]);
    } catch (err) {
      console.error('[FlaggedTab] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { fetchFlagged(); });

    // Real-time
    const channel = supabase
      .channel('admin_flagged')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'support_tickets',
        filter: "flagged_severity=not.is.null"
      }, () => { fetchFlagged(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFlagged]);

  const filtered = tickets.filter(t =>
    !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.flagged_reason?.toLowerCase().includes(search.toLowerCase())
  );

  const clearFlag = async (ticketId: string) => {
    try {
      await supabase.from('support_tickets').update({
        flagged_reason: null,
        flagged_at: null,
        flagged_severity: null,
        status: 'open',
      }).eq('id', ticketId);
      await fetchFlagged();
    } catch (err) {
      console.error('[clearFlag]', err);
    }
  };

  const saraCount = tickets.filter(t => t.flagged_severity === 'sara').length;
  const nsfwCount = tickets.filter(t => t.flagged_severity === 'nsfw').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-display italic font-medium uppercase tracking-tight text-ink">Flagged Tickets</h2>
          <p className="text-[10px] text-ink/40 uppercase tracking-widest mt-1">
            Konten yang perlu ditinjau oleh admin
          </p>
        </div>
        {tickets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[7px] font-bold uppercase tracking-widest rounded-sm bg-amber-50 text-amber-500 border border-amber-200">
              SARA {saraCount}
            </span>
            <span className="px-2 py-1 text-[7px] font-bold uppercase tracking-widest rounded-sm bg-red-50 text-red-500 border border-red-200">
              NSFW {nsfwCount}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search flagged tickets..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-ink/10 text-[11px] focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/20 rounded-sm"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto minimal-scroll space-y-2">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle size={24} strokeWidth={1} className="text-emerald-400" />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 font-medium">All Clear — No Flagged Tickets</p>
            <p className="text-[8px] text-ink/20 italic">Semua pesan aman dan sesuai pedoman</p>
          </div>
        ) : (
          filtered.map((ticket, idx) => {
            const cfg = SEVERITY_CONFIG[ticket.flagged_severity];
            const Icon = cfg?.icon || Flag;

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white border border-ink/5 rounded-sm overflow-hidden"
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-ink/[0.01] transition-colors"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center border shrink-0",
                    cfg?.color || 'bg-ink/5 text-ink/30 border-ink/10'
                  )}>
                    <Icon size={13} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-widest rounded-sm border",
                        cfg?.color || 'bg-ink/5 text-ink/30 border-ink/10'
                      )}>
                        {cfg?.label || 'FLAGGED'}
                      </span>
                      <span className="text-[7px] text-ink/20 font-mono">#{ticket.id.split('-')[0]}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-ink uppercase tracking-wider truncate">{ticket.subject}</p>
                    <p className="text-[7px] text-ink/30 mt-0.5">
                      {ticket.flagged_at ? new Date(ticket.flagged_at).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === ticket.id ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-ink/20 shrink-0"
                  >
                    <ChevronDown size={12} />
                  </motion.div>
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expandedId === ticket.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-ink/5">

                        {/* Reason */}
                        <div className={cn(
                          "p-3 border rounded-sm mt-3",
                          ticket.flagged_severity === 'nsfw'
                            ? 'bg-red-50/50 border-red-100'
                            : ticket.flagged_severity === 'sara'
                              ? 'bg-amber-50/50 border-amber-100'
                              : 'bg-ink/[0.01] border-ink/5'
                        )}>
                          <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1.5">
                            Alasan Flag
                          </p>
                          <p className="text-[10px] text-ink/70 leading-relaxed">{ticket.flagged_reason || 'Tidak ada detail'}</p>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-[8px] text-ink/30">
                          <Clock size={10} />
                          <span>Di-flag: {ticket.flagged_at ? new Date(ticket.flagged_at).toLocaleString('id-ID') : '-'}</span>
                          <span>•</span>
                          <span>Dibuat: {new Date(ticket.created_at).toLocaleString('id-ID')}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => clearFlag(ticket.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-semibold uppercase tracking-wider hover:bg-emerald-100 transition-colors rounded-sm"
                          >
                            <CheckCircle size={10} />
                            Clear Flag
                          </button>
                          <button
                            onClick={() => {
                              // Trigger admin notification
                              window.dispatchEvent(new CustomEvent('open-support-chat'));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white text-[9px] font-semibold uppercase tracking-wider hover:bg-rose transition-colors rounded-sm"
                          >
                            <MessageSquare size={10} />
                            Open Chat
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}