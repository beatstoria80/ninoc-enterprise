"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, X, Search, Tag, Zap,
  Flag, AlertTriangle, ShieldAlert, CheckCircle, Clock,
  ChevronDown, RefreshCw, TrendingUp, Clock3, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatSession } from '../types';
import { supabase } from '@/lib/supabase';

type SupportSubTab = 'chat' | 'flagged' | 'analytics';

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

interface AnalyticsSummary {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  flaggedTickets: number;
  resolutionRate: number;
  avgResponseMinutes: number;
  autoReplyCount: number;
  manualReplyCount: number;
  autoReplyRate: number;
  todayTickets: number;
  weekTickets: number;
 topCategories: { category: string; count: number }[];
}

const SEVERITY_CONFIG = {
  sara: { label: 'SARA', color: 'text-amber-500 bg-amber-50 border-amber-200', icon: AlertTriangle },
  nsfw: { label: 'NSFW', color: 'text-red-500 bg-red-50 border-red-200', icon: ShieldAlert },
};

export function MessagesTab({
  chatSessions,
  activeChatSession,
  setActiveChatSession,
  newMessage,
  setNewMessage,
  sendMessage,
  fetchChatSessions
}: {
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  setActiveChatSession: (s: ChatSession | null) => void;
  newMessage: string;
  setNewMessage: (s: string) => void;
  sendMessage: () => void;
  fetchChatSessions: () => void;
}) {
  const [subTab, setSubTab] = useState<SupportSubTab>('chat');
  const [placeholders, setPlaceholders] = useState<{ id: string; label: string; content: string; category: string }[]>([]);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);
  const [placeholderSearch, setPlaceholderSearch] = useState('');
  const [flaggedTickets, setFlaggedTickets] = useState<FlaggedTicket[]>([]);
  const [flaggedExpanded, setFlaggedExpanded] = useState<string | null>(null);
  const [flaggedSearch, setFlaggedSearch] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Fetch placeholders
  useEffect(() => {
    async function fetchPlaceholders() {
      try {
        const res = await fetch('/api/placeholders');
        const data = await res.json();
        if (data.placeholders) setPlaceholders(data.placeholders);
      } catch (err) {
        console.error('[MessagesTab] fetch placeholders error:', err);
      }
    }
    fetchPlaceholders();
  }, []);

  // ─── Fetch flagged tickets (initial load + real-time)
  const fetchFlagged = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .not('flagged_severity', 'is', null)
        .order('flagged_at', { ascending: false });
      if (data) setFlaggedTickets(data as FlaggedTicket[]);
    } catch (err) {
      console.error('[MessagesTab] fetch flagged error:', err);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchFlagged(); }, [fetchFlagged]);

  // ─── Fetch analytics summary
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/crm/analytics?period=30d');
      const data = await res.json();

      // Compute from chatSessions + flagged
      const total = chatSessions.length;
      const open = chatSessions.filter(s => s.status === 'open').length;
      const resolved = chatSessions.filter(s => s.status === 'resolved').length;
      const flagged = flaggedTickets.length;

      setAnalytics({
        totalTickets: data.summary?.totalTickets || total,
        openTickets: data.summary?.openTickets || open,
        resolvedTickets: data.summary?.resolvedTickets || resolved,
        flaggedTickets: data.summary?.flaggedTickets || flagged,
        resolutionRate: data.summary?.resolutionRate || (total > 0 ? Math.round((resolved / total) * 100) : 0),
        avgResponseMinutes: data.summary?.avgFirstResponseMinutes || 0,
        autoReplyCount: data.messages?.autoReplyCount || 0,
        manualReplyCount: data.messages?.adminReplyCount || 0,
        autoReplyRate: data.messages?.autoReplyRate || 0,
        todayTickets: chatSessions.filter(s => {
          const today = new Date().toDateString();
          return new Date(s.last_message_time).toDateString() === today;
        }).length,
        weekTickets: chatSessions.filter(s => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(s.last_message_time) >= weekAgo;
        }).length,
        topCategories: data.topCategories || [],
      });
    } catch (err) {
      console.error('[MessagesTab] fetch analytics error:', err);
      // Fallback from local data
      const total = chatSessions.length;
      const open = chatSessions.filter(s => s.status === 'open').length;
      const resolved = chatSessions.filter(s => s.status === 'resolved').length;
      setAnalytics({
        totalTickets: total,
        openTickets: open,
        resolvedTickets: resolved,
        flaggedTickets: flaggedTickets.length,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        avgResponseMinutes: 0,
        autoReplyCount: 0,
        manualReplyCount: 0,
        autoReplyRate: 0,
        todayTickets: 0,
        weekTickets: 0,
        topCategories: [],
      });
    } finally {
      setLoadingAnalytics(false);
    }
  }, [chatSessions, flaggedTickets]);

  useEffect(() => {
    const run = async () => {
      if (subTab === 'analytics') await fetchAnalytics();
    };
    run();
  }, [subTab, fetchAnalytics]);

  // ─── Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPlaceholderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPlaceholders = placeholders.filter(p =>
    !placeholderSearch || p.label.toLowerCase().includes(placeholderSearch.toLowerCase()) || p.content.toLowerCase().includes(placeholderSearch.toLowerCase())
  );

  const groupedPlaceholders = ['greeting', 'return', 'shipping', 'payment', 'closing', 'general'].reduce((acc, cat) => {
    const items = filteredPlaceholders.filter(p => p.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, typeof filteredPlaceholders>);

  const catColors: Record<string, string> = {
    greeting: 'bg-emerald-50 text-emerald-600',
    return: 'bg-rose/10 text-rose',
    shipping: 'bg-blue-50 text-blue-600',
    payment: 'bg-purple-50 text-purple-600',
    closing: 'bg-amber-50 text-amber-600',
    general: 'bg-gray-50 text-gray-500',
  };

  const filteredFlagged = flaggedTickets.filter(t =>
    !flaggedSearch || t.subject.toLowerCase().includes(flaggedSearch.toLowerCase()) || t.flagged_reason?.toLowerCase().includes(flaggedSearch.toLowerCase())
  );

  const saraCount = flaggedTickets.filter(t => t.flagged_severity === 'sara').length;
  const nsfwCount = flaggedTickets.filter(t => t.flagged_severity === 'nsfw').length;

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

  const totalUnread = chatSessions.reduce((sum, s) => sum + s.unread_count, 0);

  return (
    <div className="flex-1 min-h-0 flex gap-6 pb-4">
      {/* ─── SUB-TAB NAVIGATOR ─── */}
      <div className="w-80 bg-white rounded-[5px] border border-ink/5 flex flex-col overflow-hidden shadow-sm shrink-0">
        <div className="p-5 border-b border-ink/5 bg-ink/[0.01]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs md:text-[10px] font-medium text-ink uppercase tracking-[0.2em]">Support Center</h3>
              <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest mt-1.5">{chatSessions.length} sessions</p>
            </div>
            <div className="w-1.5 h-1.5 bg-rose rounded-full animate-pulse" />
          </div>

          {/* Sub-tab switcher */}
          <div className="flex bg-ink/5 rounded-sm p-0.5 gap-0.5">
            {[
              { key: 'chat' as SupportSubTab, label: 'Chat', icon: MessageSquare, badge: totalUnread },
              { key: 'flagged' as SupportSubTab, label: 'Flagged', icon: Flag, badge: flaggedTickets.length },
              { key: 'analytics' as SupportSubTab, label: 'Stats', icon: TrendingUp, badge: null },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSubTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-sm text-[11px] md:text-[8px] font-semibold uppercase tracking-wider transition-all duration-200",
                    subTab === tab.key
                      ? "bg-rose text-white shadow-sm"
                      : "text-ink/30 hover:text-ink/60"
                  )}
                >
                  <Icon size={9} strokeWidth={2} />
                  {tab.label}
                  {tab.badge !== null && tab.badge > 0 && (
                    <span className={cn(
                      "text-[6px] font-bold px-1 py-0.5 rounded-full",
                      subTab === tab.key ? "bg-white/20 text-white" : "bg-rose text-white"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── CHAT LIST ─── */}
        {subTab === 'chat' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveChatSession(session)}
                className={cn(
                  "w-full p-5 text-left border-b border-ink/[0.03] transition-all duration-300 group relative",
                  activeChatSession?.id === session.id ? "bg-ink/[0.02]" : "hover:bg-ink/[0.01]"
                )}
              >
                {activeChatSession?.id === session.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose" />
                )}
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs md:text-[9px] font-medium text-ink uppercase truncate pr-4">{session.customer_name}</span>
                  <span className="text-[6px] text-ink/20 uppercase font-medium">{new Date(session.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-[11px] md:text-[8px] text-ink/40 truncate flex-1 leading-snug lowercase tracking-tight">{session.last_message}</p>
                  {session.unread_count > 0 && (
                    <span className="bg-rose text-white text-[6px] font-medium px-1.5 py-0.5 rounded-[2px] ml-2 shrink-0">{session.unread_count}</span>
                  )}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="text-[5px] uppercase tracking-widest text-ink/20 font-medium">SPEC: {session.customer_email}</span>
                  <span className="text-[5px] uppercase tracking-widest text-ink/20 font-medium">•</span>
                  <span className="text-[5px] uppercase tracking-widest text-ink/20 font-medium">ID: {session.id.split('-')[0]}</span>
                </div>
              </button>
            ))}
            {chatSessions.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 opacity-20">
                <MessageSquare size={24} strokeWidth={1} />
                <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.3em] italic">No active inquiries</p>
              </div>
            )}
          </div>
        )}

        {/* ─── FLAGGED LIST ─── */}
        {subTab === 'flagged' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Flagged Search */}
            <div className="p-3 border-b border-ink/5">
              <div className="relative">
                <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input
                  type="text"
                  value={flaggedSearch}
                  onChange={e => setFlaggedSearch(e.target.value)}
                  placeholder="Search flagged..."
                  className="w-full pl-8 pr-3 py-1.5 bg-ink/[0.02] border border-ink/5 text-xs md:text-[10px] focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/20 rounded-sm"
                />
              </div>
              {(saraCount > 0 || nsfwCount > 0) && (
                <div className="flex gap-2 mt-2">
                  {saraCount > 0 && (
                    <span className="px-2 py-0.5 text-[6px] font-bold uppercase tracking-widest rounded-sm bg-amber-50 text-amber-500 border border-amber-200">
                      SARA {saraCount}
                    </span>
                  )}
                  {nsfwCount > 0 && (
                    <span className="px-2 py-0.5 text-[6px] font-bold uppercase tracking-widest rounded-sm bg-red-50 text-red-500 border border-red-200">
                      NSFW {nsfwCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {filteredFlagged.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 opacity-20">
                <CheckCircle size={24} strokeWidth={1} className="text-emerald-400" />
                <p className="text-[11px] md:text-[8px] font-medium uppercase tracking-[0.3em] italic">All Clear — No Flagged</p>
              </div>
            ) : (
              filteredFlagged.map((ticket) => {
                const cfg = SEVERITY_CONFIG[ticket.flagged_severity];
                const Icon = cfg?.icon || Flag;
                const isExpanded = flaggedExpanded === ticket.id;

                return (
                  <div key={ticket.id} className="border-b border-ink/[0.03]">
                    <button
                      onClick={() => setFlaggedExpanded(isExpanded ? null : ticket.id)}
                      className="w-full p-4 text-left hover:bg-ink/[0.01] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-6 h-6 rounded-sm flex items-center justify-center border shrink-0", cfg?.color || 'bg-ink/5')}>
                          <Icon size={10} strokeWidth={1.5} />
                        </div>
                        <span className={cn("px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-widest rounded-sm border", cfg?.color || 'bg-ink/5')}>
                          {cfg?.label || 'FLAGGED'}
                        </span>
                        <span className="text-[6px] text-ink/20 font-mono ml-auto">#{ticket.id.split('-')[0]}</span>
                      </div>
                      <p className="text-xs md:text-[9px] font-semibold text-ink uppercase tracking-wider truncate">{ticket.subject}</p>
                      <p className="text-[10px] md:text-[7px] text-ink/30 mt-0.5">
                        {ticket.flagged_at ? new Date(ticket.flagged_at).toLocaleString('id-ID') : '-'}
                      </p>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }} className="text-ink/20 mt-1">
                        <ChevronDown size={10} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 pt-0 space-y-2 border-t border-ink/5">
                            <div className={cn("p-2.5 border rounded-sm mt-2",
                              ticket.flagged_severity === 'nsfw' ? 'bg-red-50/50 border-red-100' :
                              ticket.flagged_severity === 'sara' ? 'bg-amber-50/50 border-amber-100' : 'bg-ink/[0.01]'
                            )}>
                              <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Alasan Flag</p>
                              <p className="text-xs md:text-[9px] text-ink/70 leading-relaxed">{ticket.flagged_reason || 'Tidak ada detail'}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] md:text-[7px] text-ink/30">
                              <Clock size={8} />
                              <span>Di-flag: {ticket.flagged_at ? new Date(ticket.flagged_at).toLocaleString('id-ID') : '-'}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => clearFlag(ticket.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] md:text-[8px] font-semibold uppercase tracking-wider hover:bg-emerald-100 transition-colors rounded-sm"
                              >
                                <CheckCircle size={9} />
                                Clear
                              </button>
                              <button
                                onClick={() => {
                                  const session = chatSessions.find(s => s.id === ticket.id);
                                  if (session) {
                                    setActiveChatSession(session);
                                    setSubTab('chat');
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-ink text-white text-[11px] md:text-[8px] font-semibold uppercase tracking-wider hover:bg-rose transition-colors rounded-sm"
                              >
<MessageSquare size={9} />
                                Open
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── ANALYTICS SUMMARY ─── */}
        {subTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-rose/5 border border-rose/10 rounded-sm p-3 text-center">
                <p className="text-[18px] font-display italic font-bold text-rose">{analytics?.totalTickets ?? 0}</p>
                <p className="text-[6px] text-rose/60 uppercase tracking-widest mt-0.5">Total Tiket</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-sm p-3 text-center">
                <p className="text-[18px] font-display italic font-bold text-amber-500">{analytics?.openTickets ?? 0}</p>
                <p className="text-[6px] text-amber-500/60 uppercase tracking-widest mt-0.5">Open</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-3 text-center">
                <p className="text-[18px] font-display italic font-bold text-emerald-500">{analytics?.resolvedTickets ?? 0}</p>
                <p className="text-[6px] text-emerald-500/60 uppercase tracking-widest mt-0.5">Resolved</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-sm p-3 text-center">
                <p className="text-[18px] font-display italic font-bold text-red-500">{analytics?.flaggedTickets ?? 0}</p>
                <p className="text-[6px] text-red-500/60 uppercase tracking-widest mt-0.5">Flagged</p>
              </div>
            </div>

            {/* Resolution Rate */}
            <div className="bg-white border border-ink/5 rounded-sm p-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30">Resolution Rate</p>
                <span className="text-sm md:text-[11px] font-display italic font-bold text-ink">{analytics?.resolutionRate ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${analytics?.resolutionRate ?? 0}%` }}
                />
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white border border-ink/5 rounded-sm p-3 space-y-2">
              <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30">Aktivitas</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Clock3 size={10} className="text-rose/50 shrink-0" />
                  <div>
                    <p className="text-[12px] font-display italic font-bold text-ink">{analytics?.todayTickets ?? 0}</p>
                    <p className="text-[6px] text-ink/30">Hari ini</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={10} className="text-blue-500/50 shrink-0" />
                  <div>
                    <p className="text-[12px] font-display italic font-bold text-ink">{analytics?.weekTickets ?? 0}</p>
                    <p className="text-[6px] text-ink/30">7 hari</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Breakdown */}
            <div className="bg-white border border-ink/5 rounded-sm p-3 space-y-2">
              <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30">Messages</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] md:text-[8px] text-ink/50">Auto-reply rate</span>
                    <span className="text-[11px] md:text-[8px] font-semibold text-rose">{analytics?.autoReplyRate ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${analytics?.autoReplyRate ?? 0}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-rose/5 rounded-sm p-2 text-center">
                    <p className="text-[14px] font-display italic font-bold text-rose">{analytics?.autoReplyCount ?? 0}</p>
                    <p className="text-[6px] text-rose/60">Auto</p>
                  </div>
                  <div className="bg-ink/5 rounded-sm p-2 text-center">
                    <p className="text-[14px] font-display italic font-bold text-ink">{analytics?.manualReplyCount ?? 0}</p>
                    <p className="text-[6px] text-ink/40">Manual</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avg Response */}
            {analytics?.avgResponseMinutes && analytics.avgResponseMinutes > 0 && (
              <div className="bg-white border border-ink/5 rounded-sm p-3">
                <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30 mb-1">Avg Response</p>
                <p className="text-[18px] font-display italic font-bold text-ink">{analytics.avgResponseMinutes}m</p>
                <p className="text-[6px] text-ink/30">first response time</p>
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={fetchAnalytics}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-ink/5 text-ink/40 text-[11px] md:text-[8px] font-semibold uppercase tracking-wider hover:bg-rose/10 hover:text-rose transition-colors rounded-sm"
            >
              <RefreshCw size={9} className={cn('shrink-0', loadingAnalytics && 'animate-spin')} />
              Refresh Stats
            </button>
          </div>
        )}
      </div>

      {/* ─── CHAT AREA ─── */}
      <div className="flex-1 bg-white rounded-[5px] border border-ink/5 flex flex-col overflow-hidden shadow-sm">
        {activeChatSession ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-ink rounded-[5px] flex items-center justify-center text-white text-xs md:text-[10px] font-medium">
                  {activeChatSession.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs md:text-[10px] font-medium text-ink uppercase tracking-[0.2em]">{activeChatSession.customer_name}</h3>
                  <p className="text-[10px] md:text-[7px] text-ink/30 uppercase tracking-widest mt-1">Email: {activeChatSession.customer_email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-1.5 border border-ink/10 rounded-[5px] text-[10px] md:text-[7px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose hover:border-rose transition-all duration-300"
                  onClick={async () => {
                    await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', activeChatSession.id);
                    fetchChatSessions();
                    setActiveChatSession(null);
                  }}
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Messages History */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 bg-white">
              {activeChatSession.messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender === 'admin' ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[70%] group", msg.sender === 'admin' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "p-4 rounded-[5px] text-xs md:text-[10px] leading-relaxed",
                      msg.sender === 'admin'
                        ? msg.is_auto_reply
                          ? "bg-rose/10 border border-rose/20 text-ink shadow-sm"
                          : "bg-ink text-white shadow-lg shadow-ink/5"
                        : "bg-ink/[0.03] text-ink border border-ink/5"
                    )}>
                      {msg.message}
                    </div>
                    <div className={cn("mt-2 flex items-center gap-2", msg.sender === 'admin' ? "flex-row-reverse" : "flex-row")}>
                      <span className="text-[6px] font-medium text-ink/20 uppercase tracking-widest">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.sender === 'admin' && (
                        <span className={cn("text-[6px] font-medium uppercase tracking-widest", msg.is_read ? "text-rose" : "text-ink/10")}>
                          {msg.is_auto_reply ? (
                            <span className="flex items-center gap-1">
                              <Zap size={8} className="text-rose" strokeWidth={2} />
                              AUTO
                            </span>
                          ) : msg.is_read ? 'PROCESSED' : 'SENT'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-ink/5 bg-white space-y-2">
              {/* Placeholder dropdown */}
              <AnimatePresence>
                {placeholderOpen && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white border border-ink/10 rounded-sm shadow-xl overflow-hidden z-10"
                  >
                    <div className="px-3 py-2 border-b border-ink/5 bg-ink/[0.01] flex items-center gap-2">
                      <Search size={10} className="text-ink/30 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={placeholderSearch}
                        onChange={e => setPlaceholderSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="flex-1 text-xs md:text-[10px] font-medium bg-transparent outline-none placeholder:text-ink/20"
                      />
                      <button onClick={() => setPlaceholderOpen(false)} className="text-ink/20 hover:text-ink">
                        <X size={10} />
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto minimal-scroll p-1.5 space-y-1">
                      {Object.keys(groupedPlaceholders).length === 0 && (
                        <p className="text-xs md:text-[9px] text-ink/30 italic text-center py-3">No templates found</p>
                      )}
                      {Object.entries(groupedPlaceholders).map(([cat, items]) => (
                        <div key={cat}>
                          <p className={cn("px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-widest rounded-sm mb-1", catColors[cat])}>
                            {cat}
                          </p>
                          {items.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                const current = newMessage;
                                setNewMessage(current ? `${current}\n\n${p.content}` : p.content);
                                setPlaceholderOpen(false);
                                setPlaceholderSearch('');
                              }}
                              className="w-full text-left p-2 rounded-sm hover:bg-ink/[0.02] transition-colors group"
                            >
                              <p className="text-xs md:text-[9px] font-semibold text-ink uppercase tracking-wider group-hover:text-rose transition-colors">{p.label}</p>
                              <p className="text-[11px] md:text-[8px] text-ink/30 leading-relaxed mt-0.5 line-clamp-1">{p.content}</p>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input row */}
              <div className="flex items-end gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPlaceholderOpen(prev => !prev)}
                  title="Insert placeholder template"
                  className={cn(
                    "h-10 px-2.5 rounded-sm border text-ink/30 hover:text-rose transition-all flex items-center gap-1.5 shrink-0 mb-0.5",
                    placeholderOpen ? "border-rose/30 bg-rose/5 text-rose" : "border-ink/10 hover:border-rose/20"
                  )}
                >
                  <Tag size={11} strokeWidth={1.5} />
                  <span className="text-[11px] md:text-[8px] font-semibold uppercase tracking-wider hidden lg:inline">Template</span>
                </motion.button>

                <textarea
                  rows={1}
                  value={newMessage}
                  onChange={e => {
                    if (e.target.value.length <= 500) setNewMessage(e.target.value);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type archival response..."
                  className="flex-1 bg-ink/[0.02] text-ink py-2.5 px-3.5 rounded-sm text-sm md:text-[11px] font-medium outline-none border border-ink/[0.08] placeholder:text-ink/20 transition-all focus:bg-white focus:border-rose/30 resize-none no-scrollbar min-h-[40px]"
                />
                <motion.button
                  whileHover={{ scale: 1.1, color: '#E8527A' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  className="w-7 h-10 flex items-center justify-center text-ink/10 hover:text-rose transition-all duration-300 flex-shrink-0 mb-0.5"
                >
                  <Send size={12} strokeWidth={2.5} />
                </motion.button>
              </div>
              <div className="flex justify-between items-center px-0.5">
                <p className="text-[5.5px] font-medium uppercase tracking-[0.4em] text-ink/15 italic">Customer Support Chat</p>
                <p className={cn("text-[5.5px] font-medium tracking-widest uppercase", newMessage.length > 450 ? "text-rose" : "text-ink/15")}>
                  {newMessage.length}/500
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-20">
            <MessageSquare size={48} strokeWidth={0.5} />
            <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.5em] italic">Select inquiry to respond</p>
          </div>
        )}
      </div>
    </div>
  );
}
