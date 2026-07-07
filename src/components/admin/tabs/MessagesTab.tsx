"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, X, Search, Tag, Zap,
  Flag, AlertTriangle, ShieldAlert, CheckCircle, Clock,
  ChevronDown, RefreshCw, TrendingUp, Clock3, MessageCircle,
  Trash2, Star, UserCheck, AlertCircle, Filter, Smile, Sparkles,
  Bot, User, Calendar, Flame, ArrowUpDown, SlidersHorizontal, UserPlus, Heart
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
  sara: { label: 'SARA', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
  nsfw: { label: 'NSFW', color: 'text-red-600 bg-red-50 border-red-200', icon: ShieldAlert },
};

const CRM_STATUS_CONFIG: Record<string, { label: string; color: string; badgeColor: string; icon: any; desc: string }> = {
  potential: { 
    label: 'Potential CRM', 
    color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', 
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Star, 
    desc: 'Prospek Tinggi / Siap Beli (Hot Lead)' 
  },
  active: { 
    label: 'Active Customer', 
    color: 'bg-blue-500/15 text-blue-700 border-blue-500/30', 
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: UserCheck, 
    desc: 'Pelanggan Setia / Repeat Buyer' 
  },
  general: { 
    label: 'General Inquiry', 
    color: 'bg-ink/5 text-ink/70 border-ink/10', 
    badgeColor: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: MessageCircle, 
    desc: 'Pertanyaan Umum / Normal' 
  },
  bad: { 
    label: 'Bad Lead / Spam', 
    color: 'bg-red-500/15 text-red-700 border-red-500/30', 
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle, 
    desc: 'Spam / Komplain / Tidak Valid (Bad Lead)' 
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; badgeColor: string; icon: any; desc: string }> = {
  urgent: { label: 'Urgent (🚨)', color: 'bg-red-500/15 text-red-700 border-red-500/30', badgeColor: 'bg-red-50 text-red-700 border-red-200 font-extrabold animate-pulse', icon: Flame, desc: 'Butuh penanganan instan & darurat' },
  high: { label: 'High (🔴)', color: 'bg-orange-500/15 text-orange-700 border-orange-500/30', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200 font-bold', icon: AlertTriangle, desc: 'Prioritas tinggi / Pelanggan VIP' },
  medium: { label: 'Medium (🟡)', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, desc: 'Prioritas normal / standar' },
  low: { label: 'Low (🟢)', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, desc: 'Pertanyaan ringan / minor' },
};

const FEMALE_PERSONAS = [
  { name: 'Gita', title: 'Senior Customer Success Specialist', avatar: '🌸', desc: 'Ramah, penuh empati, spesialis resolusi pesanan & kendala umum.' },
  { name: 'Alpin', title: 'VIP Lead Relationship Specialist', avatar: '🌺', desc: 'Profesional, elegan, spesialis konsultasi produk & pesanan VIP.' },
  { name: 'Nadia', title: 'Logistics & Care Coordinator', avatar: '🌷', desc: 'Cepat, tanggap, spesialis pelacakan pengiriman & retur barang.' },
  { name: 'Siti', title: 'Order & Billing Advisor', avatar: '🌹', desc: 'Teliti, solutif, spesialis kendala pembayaran, konfirmasi & refund.' },
  { name: 'Amanda', title: 'Product & Styling Advisor', avatar: '🌼', desc: 'Kreatif, interaktif, spesialis rekomendasi busana & mix-match.' },
];

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
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'realtime_active' | 'open' | 'resolved' | 'unread'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [timeOrder, setTimeOrder] = useState<'newest' | 'oldest' | 'today' | 'yesterday' | 'week'>('newest');
  const [crmFilter, setCrmFilter] = useState<string>('all');
  
  // Takeover modal state
  const [takeoverModalOpen, setTakeoverModalOpen] = useState<boolean>(false);
  const [selectedPersona, setSelectedPersona] = useState<string>('Gita');
  const [updatingMeta, setUpdatingMeta] = useState<boolean>(false);

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
  }, [chatSessions, flaggedTickets.length]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (subTab === 'analytics') fetchAnalytics(); }, [subTab, fetchAnalytics]);

  // ─── CRM Status Update Handler (0ms Optimistic UI)
  const handleUpdateCrmStatus = (ticketId: string, newStatus: string) => {
    if (activeChatSession && activeChatSession.id === ticketId) {
      setActiveChatSession({ ...activeChatSession, crm_status: newStatus });
    }
    fetch('/api/admin/support/ticket-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, crm_status: newStatus }),
    }).then(() => fetchChatSessions()).catch(err => console.error('Failed to update CRM status:', err));
  };

  // ─── Priority Update Handler (0ms Optimistic UI)
  const handleUpdatePriority = (ticketId: string, newPriority: string) => {
    if (activeChatSession && activeChatSession.id === ticketId) {
      setActiveChatSession({ ...activeChatSession, priority: newPriority });
    }
    fetch('/api/admin/support/ticket-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, priority: newPriority }),
    }).then(() => fetchChatSessions()).catch(err => console.error('Failed to update priority:', err));
  };

  // ─── Takeover Chat Handler (0ms Optimistic UI & Zero Blocking Alerts)
  const handleTakeoverChat = (adminName: string, releaseToBot = false) => {
    if (!activeChatSession) return;
    setTakeoverModalOpen(false);
    const targetPriority = releaseToBot ? activeChatSession.priority || 'medium' : 'high';
    setActiveChatSession({
      ...activeChatSession,
      assigned_admin: releaseToBot ? null : adminName,
      is_taken_over: !releaseToBot,
      priority: targetPriority,
    });

    const payload = {
      ticketId: activeChatSession.id,
      assigned_admin: releaseToBot ? null : adminName,
      is_taken_over: !releaseToBot,
      priority: targetPriority,
      sendTakeoverMessage: !releaseToBot,
      adminName: adminName,
    };

    fetch('/api/admin/support/ticket-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const json = await res.json();
      if (json.success) {
        fetchChatSessions();
      }
    }).catch(err => {
      console.error('Failed takeover:', err);
    });
  };

  // ─── Purge All Chats Handler (Clear Old & New Conversations)
  const handlePurgeAllChats = async () => {
    if (window.confirm('⚠️ PERINGATAN KRUSIAL:\n\nApakah Anda yakin ingin MENGHAPUS SELURUH percakapan chat (lama & baru) secara permanen?\n\nTindakan ini akan membersihkan seluruh antrean pesan dan tiket support agar bersih kembali.')) {
      try {
        await fetch('/api/admin/support/purge', { method: 'DELETE' });
        await supabase.from('support_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('support_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        fetchChatSessions();
        setActiveChatSession(null);
        alert('✅ Seluruh percakapan chat telah berhasil dibersihkan!');
      } catch (err) {
        console.error('Failed to purge chats:', err);
        alert('Gagal membersihkan percakapan.');
      }
    }
  };

  // Close placeholder dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPlaceholderOpen(false);
      }
    };
    if (placeholderOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [placeholderOpen]);

  const filteredPlaceholders = placeholders.filter(p =>
    !placeholderSearch ||
    p.label.toLowerCase().includes(placeholderSearch.toLowerCase()) ||
    p.content.toLowerCase().includes(placeholderSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(placeholderSearch.toLowerCase())
  );

  const groupedPlaceholders = filteredPlaceholders.reduce((acc, p) => {
    const cat = p.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, typeof placeholders>);

  const catColors: Record<string, string> = {
    greeting: 'bg-blue-50 text-blue-600',
    shipping: 'bg-amber-50 text-amber-600',
    return: 'bg-purple-50 text-purple-600',
    payment: 'bg-emerald-50 text-emerald-600',
    product: 'bg-rose/10 text-rose',
    general: 'bg-gray-50 text-gray-600',
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

  // ─── Filter & Sorting Logic
  const filteredSessions = chatSessions.filter(session => {
    // 1. CRM filter
    if (crmFilter !== 'all') {
      const currentCrm = session.crm_status || 'general';
      if (currentCrm !== crmFilter) return false;
    }

    // 2. Priority filter
    if (priorityFilter !== 'all') {
      const currentPri = session.priority || 'medium';
      if (currentPri !== priorityFilter) return false;
    }

    // 3. Status / Realtime Active filter
    if (statusFilter === 'realtime_active') {
      if (session.status !== 'open') return false;
    } else if (statusFilter === 'open') {
      if (session.status !== 'open') return false;
    } else if (statusFilter === 'resolved') {
      if (session.status !== 'resolved') return false;
    } else if (statusFilter === 'unread') {
      if (session.unread_count === 0) return false;
    }

    // 4. Time range filters
    const msgDate = new Date(session.last_message_time);
    const now = new Date();
    if (timeOrder === 'today') {
      if (msgDate.toDateString() !== now.toDateString()) return false;
    } else if (timeOrder === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (msgDate.toDateString() !== yesterday.toDateString()) return false;
    } else if (timeOrder === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      if (msgDate < weekAgo) return false;
    }

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.last_message_time).getTime();
    const timeB = new Date(b.last_message_time).getTime();
    if (timeOrder === 'oldest') {
      return timeA - timeB;
    }
    return timeB - timeA;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 pb-4">
      {/* ─── TAKEOVER PERSONA SELECTION MODAL ─── */}
      <AnimatePresence>
        {takeoverModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-ink/10 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-ink/10 bg-gradient-to-r from-pink-50 via-rose-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xl font-bold">🌸</div>
                  <div>
                    <h3 className="text-base font-bold text-ink uppercase tracking-wider">Ambil Alih Percakapan</h3>
                    <p className="text-xs text-ink/70 font-medium">Pilih Karakter Figur Wanita (Spesialis Admin NINOC) untuk melanjutkan chat</p>
                  </div>
                </div>
                <button onClick={() => setTakeoverModalOpen(false)} className="p-2 text-ink/50 hover:text-ink rounded-lg hover:bg-ink/5">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">Pilih Persona Admin Wanita:</p>
                {FEMALE_PERSONAS.map(p => {
                  const isSelected = selectedPersona === p.name;
                  return (
                    <div
                      key={p.name}
                      onClick={() => setSelectedPersona(p.name)}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3",
                        isSelected ? "border-rose bg-rose/5 shadow-xs" : "border-ink/10 hover:border-ink/30 bg-white"
                      )}
                    >
                      <div className="w-11 h-11 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                        {p.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-extrabold text-ink uppercase tracking-wide">{p.name}</span>
                          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full uppercase", isSelected ? "bg-rose text-white" : "bg-ink/5 text-ink/60")}>
                            {isSelected ? "🌸 Terpilih" : "Pilih"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-rose">{p.title}</p>
                        <p className="text-xs text-ink/70 mt-1 leading-relaxed font-normal">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600 shrink-0" />
                    Pesan Otomatis yang Akan Dikirim:
                  </p>
                  <p className="italic text-ink/80 pl-5 border-l-2 border-amber-400 mt-1">
                    &quot;🌸 Halo kak! Percakapan ini telah diambil alih dari layanan AI Otomatis dan sekarang akan dilanjutkan secara langsung oleh Admin <strong>{selectedPersona}</strong> ({FEMALE_PERSONAS.find(p => p.name === selectedPersona)?.title}). Ada yang bisa {selectedPersona} bantu periksa atau bantu selesaikan untuk pesanan kakak hari ini? 😊&quot;
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-ink/10 bg-ink/[0.02] flex items-center justify-end gap-3">
                <button
                  onClick={() => setTakeoverModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-ink/15 text-ink/70 hover:text-ink text-xs font-bold uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  disabled={updatingMeta}
                  onClick={() => handleTakeoverChat(selectedPersona, false)}
                  className="px-5 py-2.5 rounded-lg bg-rose hover:bg-pink-600 text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2"
                >
                  <UserCheck size={14} />
                  <span>🚀 Ambil Alih & Kirim Salam ({selectedPersona})</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SUB-TAB NAVIGATOR & SIDEBAR ─── */}
      <div className="w-full md:w-[420px] bg-white rounded-xl border border-ink/10 flex flex-col overflow-hidden shadow-xs shrink-0">
        <div className="p-5 border-b border-ink/10 bg-ink/[0.01]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Support Center</h3>
              <p className="text-xs text-ink/70 mt-1 font-medium">{chatSessions.length} active sessions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePurgeAllChats}
                title="Hapus Seluruh Percakapan Lama & Baru"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-xs border border-red-200 hover:border-red-500"
              >
                <Trash2 size={13} />
                <span>Purge All</span>
              </button>
              <div className="w-2.5 h-2.5 bg-rose rounded-full animate-pulse" title="Live Connection" />
            </div>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex bg-ink/5 rounded-lg p-1 gap-1">
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
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200",
                    subTab === tab.key
                      ? "bg-rose text-white shadow-xs"
                      : "text-ink/70 hover:text-ink hover:bg-white/50"
                  )}
                >
                  <Icon size={14} strokeWidth={2.2} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && tab.badge > 0 && (
                    <span className={cn(
                      "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                      subTab === tab.key ? "bg-white/20 text-white" : "bg-rose text-white"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── COMPACT MULTI-FILTER BAR (Status Active, Waktu/Jam, Prioritas, CRM) ─── */}
          {subTab === 'chat' && (
            <div className="mt-4 pt-3 border-t border-ink/10 space-y-2">
              {/* Status & Realtime Active row */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60 mr-1 flex items-center gap-1 shrink-0">
                  <SlidersHorizontal size={12} /> Status:
                </span>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'realtime_active', label: '⚡ Realtime Active', color: 'bg-amber-500 text-white border-amber-500 shadow-xs' },
                  { key: 'open', label: '📂 Open' },
                  { key: 'unread', label: '🔴 Unread' },
                  { key: 'resolved', label: '✅ Resolved' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all border",
                      statusFilter === item.key
                        ? item.color || "bg-rose text-white border-rose shadow-xs"
                        : "bg-ink/[0.03] text-ink/70 border-ink/10 hover:border-ink/30 hover:text-ink"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Date & Time row */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60 mr-1 flex items-center gap-1 shrink-0">
                  <Clock size={12} /> Waktu:
                </span>
                {[
                  { key: 'newest', label: '🕒 Terbaru' },
                  { key: 'today', label: '📅 Hari Ini' },
                  { key: 'yesterday', label: '📆 Kemarin' },
                  { key: 'week', label: '🗓️ Minggu Ini' },
                  { key: 'oldest', label: '⏳ Terlama' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTimeOrder(item.key as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all border",
                      timeOrder === item.key
                        ? "bg-ink text-white border-ink shadow-xs"
                        : "bg-ink/[0.03] text-ink/70 border-ink/10 hover:border-ink/30 hover:text-ink"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Priority filter row */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60 mr-1 flex items-center gap-1 shrink-0">
                  <Flame size={12} /> Prioritas:
                </span>
                {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(key => {
                  const cfg = PRIORITY_CONFIG[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setPriorityFilter(key)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all border",
                        priorityFilter === key
                          ? key === 'urgent' ? 'bg-red-600 text-white border-red-600 animate-pulse shadow-xs' :
                            key === 'high' ? 'bg-orange-600 text-white border-orange-600 shadow-xs' :
                            key === 'low' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' :
                            'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : "bg-ink/[0.03] text-ink/70 border-ink/10 hover:border-ink/30 hover:text-ink"
                      )}
                    >
                      {key === 'all' ? 'All Priority' : cfg?.label || key}
                    </button>
                  );
                })}
              </div>

              {/* CRM Lead status row */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60 mr-1 flex items-center gap-1 shrink-0">
                  <Star size={12} /> CRM Lead:
                </span>
                {(['all', 'potential', 'active', 'general', 'bad'] as const).map(key => {
                  return (
                    <button
                      key={key}
                      onClick={() => setCrmFilter(key)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all border",
                        crmFilter === key
                          ? key === 'potential' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' :
                            key === 'active' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' :
                            key === 'bad' ? 'bg-red-600 text-white border-red-600 shadow-xs' :
                            'bg-ink text-white border-ink shadow-xs'
                          : "bg-ink/[0.03] text-ink/70 border-ink/10 hover:border-ink/30 hover:text-ink"
                      )}
                    >
                      {key === 'all' ? 'All CRM' : CRM_STATUS_CONFIG[key]?.label || key}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── CHAT LIST ─── */}
        {subTab === 'chat' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredSessions.map((session) => {
              const crmStatus = session.crm_status || 'general';
              const crmCfg = CRM_STATUS_CONFIG[crmStatus] || CRM_STATUS_CONFIG.general;
              const CrmIcon = crmCfg.icon;

              return (
                <button
                  key={session.id}
                  onClick={() => setActiveChatSession(session)}
                  className={cn(
                    "w-full p-4 md:p-5 text-left border-b border-ink/10 transition-all duration-200 group relative",
                    activeChatSession?.id === session.id ? "bg-ink/[0.04]" : "hover:bg-ink/[0.015]"
                  )}
                >
                  {activeChatSession?.id === session.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose rounded-r" />
                  )}
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-sm font-bold text-ink uppercase truncate pr-2 flex-1">{session.customer_name}</span>
                    <span className="text-xs text-ink/60 font-mono shrink-0">{new Date(session.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {/* CRM status badge */}
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border", crmCfg.badgeColor)}>
                      <CrmIcon size={12} />
                      {crmCfg.label}
                    </span>
                    {/* Priority badge */}
                    {session.priority && session.priority !== 'medium' && (
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border", PRIORITY_CONFIG[session.priority]?.badgeColor || "bg-amber-50 text-amber-700 border-amber-200")}>
                        <Flame size={12} />
                        {session.priority}
                      </span>
                    )}
                    {/* Takeover badge */}
                    {session.is_taken_over && session.assigned_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-pink-50 text-pink-700 border border-pink-200">
                        🌸 {session.assigned_admin}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-ink/5 text-ink/60 border border-ink/10">
                        🤖 AI Bot
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end gap-2">
                    <p className="text-xs text-ink/75 truncate flex-1 leading-relaxed font-normal">{session.last_message}</p>
                    {session.unread_count > 0 && (
                      <span className="bg-rose text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 shadow-xs">{session.unread_count}</span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-ink/5 flex items-center justify-between text-xs text-ink/50 font-mono">
                    <span className="truncate">EMAIL: {session.customer_email}</span>
                    <span className="shrink-0 ml-2">ID: {session.id.split('-')[0]}</span>
                  </div>
                </button>
              );
            })}
            {filteredSessions.length === 0 && (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3 opacity-40">
                <MessageSquare size={36} strokeWidth={1} className="text-ink/60" />
                <p className="text-xs font-bold uppercase tracking-widest text-ink/80">No active inquiries found</p>
              </div>
            )}
          </div>
        )}

        {/* ─── FLAGGED LIST ─── */}
        {subTab === 'flagged' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Flagged Search */}
            <div className="p-4 border-b border-ink/10">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/60" />
                <input
                  type="text"
                  value={flaggedSearch}
                  onChange={e => setFlaggedSearch(e.target.value)}
                  placeholder="Search flagged tickets..."
                  className="w-full pl-9 pr-4 py-2 bg-ink/[0.03] border border-ink/10 text-xs font-medium focus:outline-none focus:border-rose transition-colors placeholder:text-ink/50 rounded-lg"
                />
              </div>
              {(saraCount > 0 || nsfwCount > 0) && (
                <div className="flex gap-2 mt-3">
                  {saraCount > 0 && (
                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      SARA {saraCount}
                    </span>
                  )}
                  {nsfwCount > 0 && (
                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-red-50 text-red-700 border border-red-200">
                      NSFW {nsfwCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {filteredFlagged.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3 opacity-40">
                <CheckCircle size={36} strokeWidth={1} className="text-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-ink/80">All Clear — No Flagged</p>
              </div>
            ) : (
              filteredFlagged.map(ticket => {
                const isExpanded = flaggedExpanded === ticket.id;
                const severityCfg = SEVERITY_CONFIG[ticket.flagged_severity] || SEVERITY_CONFIG.nsfw;
                const SeverityIcon = severityCfg.icon;

                return (
                  <div
                    key={ticket.id}
                    className={cn(
                      "border-b border-ink/10 transition-colors",
                      ticket.flagged_severity === 'nsfw' ? 'bg-red-50/20 hover:bg-red-50/40' :
                      ticket.flagged_severity === 'sara' ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'bg-white hover:bg-ink/[0.01]'
                    )}
                  >
                    <div
                      onClick={() => setFlaggedExpanded(isExpanded ? null : ticket.id)}
                      className="p-4 cursor-pointer flex items-start gap-3"
                    >
                      <SeverityIcon size={18} className={cn("shrink-0 mt-0.5", ticket.flagged_severity === 'nsfw' ? 'text-red-600' : 'text-amber-600')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded border", severityCfg.color)}>
                            {severityCfg.label}
                          </span>
                          <span className="text-xs text-ink/60 font-mono ml-auto">#{ticket.id.split('-')[0]}</span>
                        </div>
                        <p className="text-sm font-bold text-ink uppercase tracking-wide truncate">{ticket.subject}</p>
                        <p className="text-xs text-ink/70 mt-1 font-medium">
                          Flagged reason: <span className="text-rose font-semibold">{ticket.flagged_reason || 'Tidak ada detail'}</span>
                        </p>
                      </div>
                      <ChevronDown size={16} className={cn("text-ink/40 shrink-0 transition-transform mt-1", isExpanded && "rotate-180")} />
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-1 space-y-3 border-t border-ink/10 bg-white/50">
                            <div className={cn("p-3 border rounded-lg mt-2",
                              ticket.flagged_severity === 'nsfw' ? 'bg-red-50 border-red-200' :
                              ticket.flagged_severity === 'sara' ? 'bg-amber-50 border-amber-200' : 'bg-ink/[0.02]'
                            )}>
                              <p className="text-xs font-bold uppercase tracking-wider text-ink/80 mb-1">Alasan Flag Detail</p>
                              <p className="text-xs text-ink/90 leading-relaxed font-medium">{ticket.flagged_reason || 'Tidak ada detail'}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-ink/60 font-mono">
                              <Clock size={12} />
                              <span>Di-flag: {ticket.flagged_at ? new Date(ticket.flagged_at).toLocaleString('id-ID') : '-'}</span>
                            </div>
                            <div className="flex gap-3 pt-1">
                              <button
                                onClick={() => clearFlag(ticket.id)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors rounded-lg border border-emerald-200 shadow-xs"
                              >
                                <CheckCircle size={14} />
                                Clear Flag
                              </button>
                              <button
                                onClick={() => {
                                  const session = chatSessions.find(s => s.id === ticket.id);
                                  if (session) {
                                    setActiveChatSession(session);
                                    setSubTab('chat');
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-ink text-white text-xs font-bold uppercase tracking-wider hover:bg-rose transition-colors rounded-lg shadow-xs"
                              >
                                <MessageSquare size={14} />
                                Open Chat
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
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-rose/5 border border-rose/15 rounded-xl p-4 text-center">
                <p className="text-2xl font-display italic font-bold text-rose">{analytics?.totalTickets ?? 0}</p>
                <p className="text-xs font-bold text-rose/70 uppercase tracking-wider mt-1">Total Tiket</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-display italic font-bold text-amber-600">{analytics?.openTickets ?? 0}</p>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mt-1">Open</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-display italic font-bold text-emerald-600">{analytics?.resolvedTickets ?? 0}</p>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-1">Resolved</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-display italic font-bold text-red-600">{analytics?.flaggedTickets ?? 0}</p>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider mt-1">Flagged</p>
              </div>
            </div>

            {/* Resolution Rate */}
            <div className="bg-white border border-ink/10 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/80">Resolution Rate</p>
                <span className="text-sm font-display italic font-bold text-ink">{analytics?.resolutionRate ?? 0}%</span>
              </div>
              <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${analytics?.resolutionRate ?? 0}%` }}
                />
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white border border-ink/10 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/80">Aktivitas</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <Clock3 size={16} className="text-rose/60 shrink-0" />
                  <div>
                    <p className="text-base font-display italic font-bold text-ink">{analytics?.todayTickets ?? 0}</p>
                    <p className="text-xs text-ink/60 font-medium">Hari ini</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-ink/60 shrink-0" />
                  <div>
                    <p className="text-base font-display italic font-bold text-ink">{analytics?.weekTickets ?? 0}</p>
                    <p className="text-xs text-ink/60 font-medium">7 hari terakhir</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages breakdown */}
            <div className="bg-white border border-ink/10 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/80">Balasan Pesan</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-ink/70">Auto-reply rate</span>
                  <span className="font-bold text-rose">{analytics?.autoReplyRate ?? 0}%</span>
                </div>
                <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${analytics?.autoReplyRate ?? 0}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-rose/5 border border-rose/10 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-display italic font-bold text-rose">{analytics?.autoReplyCount ?? 0}</p>
                    <p className="text-xs font-bold text-rose/70">Auto Reply</p>
                  </div>
                  <div className="bg-ink/5 border border-ink/10 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-display italic font-bold text-ink">{analytics?.manualReplyCount ?? 0}</p>
                    <p className="text-xs font-bold text-ink/80">Manual Reply</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avg Response */}
            {analytics?.avgResponseMinutes !== undefined && (
              <div className="bg-white border border-ink/10 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/80 mb-1">Avg First Response</p>
                <p className="text-2xl font-display italic font-bold text-ink">{analytics.avgResponseMinutes}m</p>
                <p className="text-xs text-ink/60 font-medium mt-0.5">Waktu respons pertama ke customer</p>
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={fetchAnalytics}
              className="w-full flex items-center justify-center gap-2 py-3 bg-ink/5 text-ink/80 text-xs font-bold uppercase tracking-wider hover:bg-rose/10 hover:text-rose transition-colors rounded-lg shadow-xs"
            >
              <RefreshCw size={13} className={cn('shrink-0', loadingAnalytics && 'animate-spin')} />
              <span>Refresh Statistics</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── CHAT AREA ─── */}
      <div className="flex-1 bg-white rounded-xl border border-ink/10 flex flex-col overflow-hidden shadow-xs">
        {activeChatSession ? (
          <>
            {/* ─── TAKEOVER BANNER (AI BOT VS HUMAN ADMIN) ─── */}
            <div className={cn(
              "p-3.5 md:px-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
              activeChatSession.is_taken_over && activeChatSession.assigned_admin
                ? "bg-gradient-to-r from-pink-50/80 via-rose-50/50 to-white border-pink-200"
                : "bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white border-blue-200"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0 border",
                  activeChatSession.is_taken_over && activeChatSession.assigned_admin
                    ? "bg-pink-100 border-pink-300 text-pink-700"
                    : "bg-blue-100 border-blue-300 text-blue-700"
                )}>
                  {activeChatSession.is_taken_over && activeChatSession.assigned_admin
                    ? FEMALE_PERSONAS.find(p => p.name === activeChatSession.assigned_admin)?.avatar || '🌸'
                    : '🤖'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border",
                      activeChatSession.is_taken_over && activeChatSession.assigned_admin
                        ? "bg-pink-500 text-white border-pink-600"
                        : "bg-blue-600 text-white border-blue-700"
                    )}>
                      {activeChatSession.is_taken_over && activeChatSession.assigned_admin
                        ? `Live Admin: ${activeChatSession.assigned_admin}`
                        : "🤖 AI Chatbot 24/7"}
                    </span>
                    {activeChatSession.is_taken_over && activeChatSession.assigned_admin && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/75 font-medium mt-0.5">
                    {activeChatSession.is_taken_over && activeChatSession.assigned_admin
                      ? `Percakapan diambil alih & dilanjutkan oleh spesialis wanita (${FEMALE_PERSONAS.find(p => p.name === activeChatSession.assigned_admin)?.title || 'Customer Success'}).`
                      : "Percakapan dijawab otomatis oleh sistem bot. Ambil alih untuk memberikan layanan manusia personal."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setTakeoverModalOpen(true)}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all duration-200 border",
                    activeChatSession.is_taken_over && activeChatSession.assigned_admin
                      ? "bg-white text-ink border-ink/20 hover:border-pink-500 hover:text-pink-600"
                      : "bg-rose text-white border-rose hover:bg-pink-600 shadow-md animate-bounce hover:animate-none"
                  )}
                >
                  <UserPlus size={14} />
                  <span>{activeChatSession.is_taken_over && activeChatSession.assigned_admin ? "🌸 Ganti Persona" : "🌸 Ambil Alih dengan Admin"}</span>
                </button>

                {activeChatSession.is_taken_over && activeChatSession.assigned_admin && (
                  <button
                    disabled={updatingMeta}
                    onClick={() => handleTakeoverChat('Bot', true)}
                    className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-ink/5 text-ink/70 hover:bg-ink hover:text-white border border-ink/10 transition-all"
                    title="Kembalikan ke sistem AI Bot otomatis"
                  >
                    🤖 Release ke AI Bot
                  </button>
                )}
              </div>
            </div>

            {/* Chat Header */}
            <div className="p-4 md:p-5 border-b border-ink/10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-ink/[0.01]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 shadow-xs">
                  {activeChatSession.customer_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-ink uppercase tracking-wide truncate">{activeChatSession.customer_name}</h3>
                  <p className="text-xs text-ink/60 font-mono mt-0.5 truncate">Email: {activeChatSession.customer_email}</p>
                </div>
              </div>

              {/* CRM Status Tagging, Priority Selector & Resolved Action */}
              <div className="flex flex-wrap items-center gap-2">
                {/* CRM Buttons */}
                <div className="flex items-center gap-1 bg-ink/5 p-1 rounded-lg">
                  {(['potential', 'active', 'general', 'bad'] as const).map(status => {
                    const cfg = CRM_STATUS_CONFIG[status];
                    const Icon = cfg.icon;
                    const isSelected = (activeChatSession.crm_status || 'general') === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleUpdateCrmStatus(activeChatSession.id, status)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all duration-200",
                          isSelected ? `${cfg.color} shadow-xs font-extrabold scale-[1.02]` : "text-ink/60 hover:text-ink hover:bg-white/60"
                        )}
                        title={cfg.desc}
                      >
                        <Icon size={12} />
                        <span className="hidden sm:inline">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Priority Selector */}
                <div className="flex items-center gap-1 bg-ink/5 p-1 rounded-lg">
                  <span className="text-xs font-bold text-ink/50 px-1.5 flex items-center gap-1"><Flame size={12} /> Pri:</span>
                  {(['urgent', 'high', 'medium', 'low'] as const).map(pri => {
                    const cfg = PRIORITY_CONFIG[pri];
                    const isSelected = (activeChatSession.priority || 'medium') === pri;
                    return (
                      <button
                        key={pri}
                        onClick={() => handleUpdatePriority(activeChatSession.id, pri)}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all",
                          isSelected ? `${cfg.color} shadow-xs font-extrabold` : "text-ink/60 hover:text-ink hover:bg-white/60"
                        )}
                        title={cfg?.desc}
                      >
                        {pri === 'urgent' ? '🚨 Urgent' : pri === 'high' ? '🔴 High' : pri === 'low' ? '🟢 Low' : '🟡 Med'}
                      </button>
                    );
                  })}
                </div>

                {activeChatSession.category === 'return' ? (
                  <div className="px-4 py-2 border border-amber-600/30 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 shrink-0 ml-auto xl:ml-0 cursor-not-allowed" title="Tiket Retur / Refund direkam permanen untuk kepentingan audit.">
                    <ShieldAlert size={14} />
                    <span>Audit Retained</span>
                  </div>
                ) : (
                  <button
                    className="px-4 py-2 border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-xs flex items-center gap-1.5 shrink-0 ml-auto xl:ml-0"
                    onClick={async () => {
                      await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', activeChatSession.id);
                      fetchChatSessions();
                      setActiveChatSession(null);
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>Mark Resolved</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages History */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-4 bg-white">
              {activeChatSession.messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender === 'admin' ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] md:max-w-[70%] group", msg.sender === 'admin' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "p-3.5 md:p-4 rounded-2xl text-sm leading-relaxed shadow-xs font-normal whitespace-pre-wrap",
                      msg.sender === 'admin'
                        ? msg.is_auto_reply
                          ? "bg-rose/10 border border-rose/20 text-ink rounded-tr-none"
                          : "bg-ink text-white rounded-tr-none"
                        : "bg-ink/[0.04] text-ink border border-ink/10 rounded-tl-none"
                    )}>
                      {msg.message}
                    </div>
                    <div className={cn("mt-1.5 flex items-center gap-2 px-1", msg.sender === 'admin' ? "flex-row-reverse" : "flex-row")}>
                      <span className="text-xs text-ink/50 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.sender === 'admin' && (
                        <span className={cn("text-xs font-bold uppercase tracking-wider", msg.is_read ? "text-emerald-600" : "text-ink/40")}>
                          {msg.is_auto_reply ? (
                            <span className="flex items-center gap-1 text-rose">
                              <Zap size={11} strokeWidth={2.5} />
                              AUTO BOT
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-pink-500 font-extrabold">
                              🌸 {activeChatSession.assigned_admin || 'ADMIN'} • {msg.is_read ? '✓ READ' : 'SENT'}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-ink/10 bg-white space-y-3">
              {/* Placeholder dropdown */}
              <AnimatePresence>
                {placeholderOpen && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white border border-ink/15 rounded-xl shadow-xl overflow-hidden z-10"
                  >
                    <div className="px-3 py-2 border-b border-ink/10 bg-ink/[0.02] flex items-center gap-2">
                      <Search size={14} className="text-ink/60 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={placeholderSearch}
                        onChange={e => setPlaceholderSearch(e.target.value)}
                        placeholder="Search quick reply templates..."
                        className="flex-1 text-xs font-semibold bg-transparent outline-none placeholder:text-ink/50"
                      />
                      <button onClick={() => setPlaceholderOpen(false)} className="text-ink/60 hover:text-ink">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto minimal-scroll p-2 space-y-2">
                      {Object.keys(groupedPlaceholders).length === 0 && (
                        <p className="text-xs text-ink/60 italic text-center py-4">No templates found</p>
                      )}
                      {Object.entries(groupedPlaceholders).map(([cat, items]) => (
                        <div key={cat}>
                          <p className={cn("px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md mb-1 inline-block", catColors[cat])}>
                            {cat}
                          </p>
                          <div className="space-y-1">
                            {items.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  const current = newMessage;
                                  setNewMessage(current ? `${current}\n\n${p.content}` : p.content);
                                  setPlaceholderOpen(false);
                                  setPlaceholderSearch('');
                                }}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-ink/[0.03] transition-colors group border border-transparent hover:border-ink/10"
                              >
                                <p className="text-xs font-bold text-ink uppercase tracking-wide group-hover:text-rose transition-colors">{p.label}</p>
                                <p className="text-xs text-ink/70 leading-relaxed mt-0.5 line-clamp-2 font-normal">{p.content}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input row */}
              <div className="flex items-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPlaceholderOpen(prev => !prev)}
                  title="Insert quick reply template"
                  className={cn(
                    "h-11 px-3.5 rounded-lg border text-ink/80 hover:text-rose transition-all flex items-center gap-1.5 shrink-0 shadow-xs",
                    placeholderOpen ? "border-rose/40 bg-rose/10 text-rose font-bold" : "border-ink/15 hover:border-rose/30 bg-ink/[0.01]"
                  )}
                >
                  <Tag size={14} strokeWidth={2} />
                  <span className="text-xs font-bold uppercase tracking-wider hidden lg:inline">Template</span>
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
                  placeholder={activeChatSession.is_taken_over && activeChatSession.assigned_admin ? `Ketik balasan sebagai Admin ${activeChatSession.assigned_admin}...` : "Ketik balasan untuk customer..."}
                  className="flex-1 bg-ink/[0.02] text-ink py-3 px-4 rounded-lg text-sm font-medium outline-none border border-ink/15 placeholder:text-ink/50 transition-all focus:bg-white focus:border-rose focus:ring-1 focus:ring-rose/20 resize-none no-scrollbar min-h-[44px]"
                />
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#E8527A', color: '#ffffff' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage()}
                  className="h-11 px-5 rounded-lg bg-ink text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 hover:shadow-md"
                >
                  <span>Send</span>
                  <Send size={13} strokeWidth={2.5} />
                </motion.button>
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 flex items-center gap-1">
                  <Sparkles size={12} /> Live Customer Support Desk • {activeChatSession.assigned_admin ? `Admin: ${activeChatSession.assigned_admin}` : 'AI Bot Mode'}
                </p>
                <p className={cn("text-xs font-mono font-bold tracking-wide", newMessage.length > 450 ? "text-rose" : "text-ink/40")}>
                  {newMessage.length} / 500 chars
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-12 opacity-40">
            <div className="w-20 h-20 rounded-full bg-ink/5 flex items-center justify-center">
              <MessageSquare size={36} strokeWidth={1.5} className="text-ink/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-ink">Select an inquiry to respond</p>
              <p className="text-xs text-ink/60 mt-1 font-normal">Pilih tiket percakapan di bilah kiri atau gunakan filter status CRM, Prioritas & Waktu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
