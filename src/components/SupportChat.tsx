"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, ChevronRight, ArrowLeft, Plus, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  order_id: string | null;
  category: string;
  status: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin';
  message: string;
  created_at: string;
  is_auto_reply?: boolean;
}

interface PlaceholderConfig {
  id: string;
  label: string;
  content: string;
  category: string;
}

// ─── Auto-Reply Keyword Map ───────────────────────────────────────────────────
const AUTO_REPLY_RULES: Record<string, string[]> = {
  greeting: ['halo', 'hai', 'hallo', 'hi', 'pagi', 'siang', 'sore', 'malam', 'apa kabar', 'good morning'],
  return: ['retur', 'refund', 'tukar', 'exchange', 'kembalikan', 'barang rusak', 'cacat', 'size salah', 'tidak cocok', 'kirim ulang', 'return'],
  shipping: ['kirim', 'pesanan', 'order', 'tracking', 'lacak', 'resi', 'delivery', 'bawa', 'sampai', 'pengiriman', 'estimasi', 'kapan', 'belum sampai'],
  payment: ['bayar', 'transfer', 'midtrans', 'pembayaran', 'transfer', 'bukti', 'lunas', 'pending', 'gagal', 'error payment', 'bukti transfer'],
};

// ─── Find best auto-reply based on message content ────────────────────────────
function findAutoReply(message: string, placeholders: PlaceholderConfig[]): PlaceholderConfig | null {
  const lower = message.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(AUTO_REPLY_RULES)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Return first matching placeholder in this category
        const match = placeholders.find(p => p.category === category);
        if (match) return match;
      }
    }
  }

  // Default to greeting category
  return placeholders.find(p => p.category === 'greeting') || null;
}

// ─── Send auto-reply to a ticket ────────────────────────────────────────────
async function sendAutoReply(ticketId: string, content: string): Promise<void> {
  await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_role: 'admin',
    message: content,
    is_auto_reply: true,
  });
}

export default function SupportChat() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'new_ticket' | 'chat'>('home');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('');
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifCard, setShowNotifCard] = useState(false);
  const [lastNotif, setLastNotif] = useState<{ subject: string; message: string; from: string } | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderConfig[]>([]);
  const [autoReplySent, setAutoReplySent] = useState<string | null>(null);
  
  // Dispatch unread count to other components (like MobileLayout)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('support-unread-count', { detail: notifCount }));
  }, [notifCount]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUnreadRef = useRef(false);

  const fetchTickets = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setTickets(data);
  }, []);

  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setActiveTab('chat');
    setAutoReplySent(null); // Reset auto-reply flag for new ticket
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    hasUnreadRef.current = false;
    setNotifCount(0);
  }, []);

  // Fetch logged-in user OR allow guest mode
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUser(user);
          fetchTickets(user.id);
        } else {
          // Guest mode: no user, but still show UI and allow chat
          console.log('[Support] Guest mode active.');
        }
      } catch (err) {
        // Guest mode on error — still allow chat
        console.log('[Support] Guest mode active (auth error):', err);
      }
    };
    fetchUser();
  }, [fetchTickets]);

  // Fetch placeholders for auto-reply
  useEffect(() => {
    const fetchPlaceholders = async () => {
      try {
        const res = await fetch('/api/placeholders');
        const data = await res.json();
        if (data.placeholders) setPlaceholders(data.placeholders);
      } catch (err) {
        console.error('[SupportChat] fetch placeholders error:', err);
      }
    };
    fetchPlaceholders();
  }, []);

  // Real-time subscription for new admin messages
  useEffect(() => {
    const channel = supabase
      .channel('support-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `sender_role=eq.admin`
        },
        async (payload) => {
          const newMsg = payload.new as SupportMessage;
          
          // Only notify if this message belongs to our tickets or active session
          const isRelevant = activeTicket?.id === newMsg.ticket_id || tickets.some(t => t.id === newMsg.ticket_id);
          if (!isRelevant) return;

          if (activeTab === 'chat' && activeTicket?.id === newMsg.ticket_id) {
            setChatMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            return;
          }

          // Show notification card + badge
          hasUnreadRef.current = true;
          setNotifCount(prev => prev + 1);
          
          const relevantTicket = activeTicket?.id === newMsg.ticket_id ? activeTicket : tickets.find(t => t.id === newMsg.ticket_id);
          
          setLastNotif({
            subject: relevantTicket?.subject || 'Status Update',
            message: newMsg.message,
            from: 'Studio'
          });
          setShowNotifCard(true);

          setTimeout(() => {
            setShowNotifCard(false);
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tickets, activeTab, activeTicket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startNewTicket = async () => {
    if (!subject || !category || !user) return;
    const { data } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        order_id: orderId,
        category,
        status: 'open'
      })
      .select()
      .single();
    if (data) {
      setTickets([data, ...tickets]);
      openTicket(data);
      setSubject('');
      setOrderId('');
      setCategory('');
    }
  };

  const sendMessage = async (overrideMessage?: string, overrideTicket?: SupportTicket) => {
    const msgToSend = overrideMessage || message;
    const targetTicket = overrideTicket || activeTicket;

    if (!msgToSend.trim() || !targetTicket) return;

    const newMessage = {
      ticket_id: targetTicket.id,
      sender_id: null,
      sender_role: 'customer' as const,
      message: msgToSend.trim()
    };

    const { data, error } = await supabase
      .from('support_messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      console.error('[sendMessage] Supabase error:', error.code, error.message);
      return;
    }

    if (data) {
      setChatMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setMessage('');

      // Auto-reply: trigger after customer sends a message (only once per session)
      if (activeTicket && !autoReplySent) {
        const autoReply = findAutoReply(msgToSend.trim(), placeholders);
        if (autoReply) {
          setAutoReplySent(activeTicket.id);
          await sendAutoReply(activeTicket.id, autoReply.content);
          // Trigger realtime refresh by dispatching event
          window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: activeTicket.id } }));
        }
      }
    }
  };

  const startGeneralChat = async () => {
    if (!message.trim()) return;
    if (message.length > 500) return;

    const msgToSend = message;
    const tempId = `guest-${Date.now()}`;

    // Optimistic UI: langsung tampilkan di chat
    const optimisticMsg: SupportMessage = {
      id: tempId,
      ticket_id: tempId,
      sender_id: '',
      sender_role: 'customer',
      message: msgToSend,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setMessage('');

    try {
      // Create or find General Inquiry ticket
      let genTicket = tickets.find(t => t.subject === 'General Inquiry');

      if (!genTicket) {
        const { data: ticketData } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user?.id || null,
            subject: 'General Inquiry',
            category: 'other',
            status: 'open'
          })
          .select()
          .single();
        if (ticketData) {
          genTicket = ticketData;
          setTickets(prev => [ticketData, ...prev]);
        }
      }

      if (genTicket) {
        // Insert message
        const { data: savedMsg, error } = await supabase
          .from('support_messages')
          .insert({
            ticket_id: genTicket.id,
            sender_id: null,
            sender_role: 'customer',
            message: msgToSend
          })
          .select()
          .single();

        if (error) {
          console.error('[startGeneralChat] Insert error:', error);
          // Remove optimistic message on error
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          return;
        }

        if (savedMsg) {
          // Replace optimistic message with real one
          setChatMessages(prev =>
            prev.map(m => m.id === tempId ? savedMsg : m)
          );
          setActiveTicket(genTicket);
          setActiveTab('chat');

          // Auto-reply for general inquiry (only once per new ticket)
          const autoReply = findAutoReply(msgToSend, placeholders);
          if (autoReply && !autoReplySent) {
            setAutoReplySent(genTicket.id);
            await sendAutoReply(genTicket.id, autoReply.content);
            window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: genTicket.id } }));
          }
        }
      }
    } catch (err) {
      console.error('[startGeneralChat] Error:', err);
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // Listen for external open events (from Burger Menu)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-chat', handleOpen);
    return () => window.removeEventListener('open-support-chat', handleOpen);
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [message, activeTab]);

  // Hide floating chat on admin dashboard (admin has its own Support Chat tab)
  if (isAdminPage) return null;

  return (
    <>
      {/* ================================================ */}
      {/* CENTER-SCREEN NOTIFICATION CARD (Top Right) */}
      {/* ================================================ */}
      <AnimatePresence>
        {showNotifCard && lastNotif && activeTab !== 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 right-6 z-[600] w-[300px] bg-white rounded-2xl shadow-2xl border border-ink/5 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-ink px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose rounded-full animate-pulse" />
                <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/40">Studio Reply</p>
              </div>
              <button
                onClick={() => setShowNotifCard(false)}
                className="text-white/30 hover:text-white transition-colors"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-[8px] font-medium text-rose uppercase tracking-widest">New Message</p>
              <p className="text-[9px] font-medium text-ink uppercase italic">{lastNotif.subject}</p>
              <p className="text-[9px] font-medium text-ink/50 leading-relaxed line-clamp-2">{lastNotif.message}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowNotifCard(false);
                  // Find the ticket and open it
                  const t = tickets.find(t => t.subject === lastNotif.subject);
                  if (t) {
                    setIsOpen(true);
                    openTicket(t);
                  }
                }}
                className="w-full bg-rose text-white py-2.5 rounded-lg text-[8px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors"
              >
                <MessageSquare size={10} /> Open Support
              </motion.button>
            </div>
            {/* Progress bar */}
            <div className="h-[2px] bg-ink/5">
              <motion.div
                className="h-full bg-rose"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================ */}
      {/* MICRO TRIGGER - Desktop Only */}
      {/* ================================================ */}
      <div className="fixed bottom-5 right-5 z-[500] hidden md:block">
        {/* Badge counter */}
        <AnimatePresence>
          {notifCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-rose text-white text-[8px] font-medium rounded-full w-5 h-5 flex items-center justify-center shadow-lg z-10"
            >
              {notifCount > 9 ? '9+' : notifCount}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setShowNotifCard(false);
          }}
          className="relative w-9 h-9 bg-ink rounded-full shadow-lg flex items-center justify-center hover:bg-rose transition-colors duration-300"
        >
          {/* Subtle breathe pulse */}
          <motion.div
            className="absolute inset-0 bg-rose rounded-full opacity-0"
            animate={notifCount > 0 ? { scale: [1, 1.4, 1], opacity: [0, 0.3, 0] } : { scale: [1, 1.3, 1], opacity: [0, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <X size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <MessageSquare size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* COMPACT PANEL - Responsive */}
      <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={typeof window !== 'undefined' && window.innerWidth < 768 
                ? { opacity: 0, y: '100%' } 
                : { opacity: 0, y: 8, scale: 0.96 }
              }
              animate={typeof window !== 'undefined' && window.innerWidth < 768 
                ? { opacity: 1, y: 0 } 
                : { opacity: 1, y: 0, scale: 1 }
              }
              exit={typeof window !== 'undefined' && window.innerWidth < 768 
                ? { opacity: 0, y: '100%' } 
                : { opacity: 0, y: 8, scale: 0.96 }
              }
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "fixed z-[600] bg-white shadow-2xl overflow-hidden border border-ink/5 flex flex-col transition-all",
                "bottom-0 left-0 right-0 h-[80vh] rounded-t-3xl md:bottom-12 md:right-5 md:left-auto md:w-[300px] md:h-[480px] md:rounded-2xl"
              )}
            >
              {/* Backdrop for mobile */}
              <div className="md:hidden absolute inset-0 bg-ink/20 backdrop-blur-sm -z-10" onClick={() => setIsOpen(false)} />
              {/* HEADER */}
              <motion.div
                className="bg-ink p-4 text-white relative"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors"
                >
                  <X size={14} strokeWidth={1.5} />
                </motion.button>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/30 flex items-center gap-1.5">
                      <span className={cn("w-1 h-1 rounded-full", user ? "bg-emerald-500" : "bg-rose animate-pulse")} />
                      NINOC Support
                    </p>
                    <h3 className="text-xs font-display font-medium italic uppercase tracking-widest">Support <span className="text-rose">Center</span></h3>
                  </div>
                  {user && (
                    <p className="text-[5px] font-medium text-white/10 uppercase tracking-widest">SPEC: {user.email?.split('@')[0]}</p>
                  )}
                </div>
              </motion.div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'home' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full overflow-hidden bg-white"
                  >
                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                      {/* QUICK ACTION HEADER */}
                      <div className="flex items-center justify-between">
                        <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/20">Support Center</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab('new_ticket')}
                          className="text-[8px] font-medium uppercase tracking-widest text-rose hover:text-ink transition-colors flex items-center gap-1.5"
                        >
                          <Plus size={10} /> New Ticket
                        </motion.button>
                      </div>

                      {/* ACTIVE CONVERSATIONS LIST */}
                      <div className="space-y-3">
                        <p className="text-[6px] font-medium uppercase tracking-[0.1em] text-ink/10">Active Conversations</p>
                        {tickets.length > 0 ? (
                          <div className="space-y-1">
                            {tickets.map((t, i) => (
                              <motion.button
                                key={t.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => openTicket(t)}
                                className="w-full flex items-center justify-between p-3 bg-ink/[0.02] border border-ink/5 rounded-xl hover:bg-ink/[0.04] hover:border-ink/10 transition-all duration-300 text-left group"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9px] font-medium text-ink uppercase truncate">{t.subject}</p>
                                  <p className="text-[6px] font-medium text-ink/30 uppercase tracking-[0.2em] mt-0.5">#{t.id.split('-')[0]} • {t.status}</p>
                                </div>
                                <ChevronRight size={10} className="text-ink/10 group-hover:text-rose transition-colors duration-300 ml-3 flex-shrink-0" />
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-20">
                            <MessageSquare size={24} strokeWidth={1} />
                            <p className="text-[8px] font-medium uppercase tracking-[0.3em] italic">Inbox Empty</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PROMINENT BOTTOM INPUT - FIXED FOR CLICK */}
                    <div className="relative z-10 p-3 bg-white border-t border-ink/5">
                      <div className="flex items-end gap-1.5">
                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={message}
                          onChange={(e) => {
                            if (e.target.value.length <= 500) {
                              setMessage(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              startGeneralChat();
                            }
                          }}
                          placeholder="Direct inquiry..."
                          autoComplete="off"
                          className="flex-1 bg-ink/[0.02] text-ink py-2.5 px-3.5 rounded-[5px] text-[11px] font-medium outline-none placeholder:text-ink/20 border border-ink/[0.08] transition-all focus:border-rose/30 focus:bg-white resize-none min-h-[40px] focus:shadow-md"
                        />
                        <button
                          onClick={startGeneralChat}
                          className="w-8 h-10 flex items-center justify-center text-ink/20 hover:text-rose transition-all duration-300 flex-shrink-0 active:scale-90"
                          aria-label="Send message"
                        >
                          <Send size={13} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center px-0.5">
                        <p className="text-[5.5px] font-medium uppercase tracking-[0.4em] text-ink/15">
                          {user ? "Studio Direct Channel" : "Guest Mode — Chat Active"}
                        </p>
                        <p className={cn('text-[5.5px] font-medium tracking-widest uppercase', message.length > 450 ? 'text-rose' : 'text-ink/15')}>
                          {message.length}/500
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'new_ticket' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 space-y-3 flex-1 overflow-y-auto no-scrollbar"
                  >
                    <motion.button
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('home')}
                      className="text-[7px] font-medium uppercase tracking-[0.2em] text-rose flex items-center gap-1"
                    >
                      <ArrowLeft size={8} /> Back
                    </motion.button>
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[6px] font-medium uppercase tracking-widest text-ink/35 ml-0.5">Subject</label>
                        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="..." className="w-full bg-ink/5 border-none rounded-lg py-1.5 px-2.5 text-[9px] font-medium outline-none placeholder:text-ink/15" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[6px] font-medium uppercase tracking-widest text-ink/35 ml-0.5">Order ID</label>
                        <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="NINOC-..." className="w-full bg-ink/5 border-none rounded-lg py-1.5 px-2.5 text-[9px] font-medium outline-none placeholder:text-ink/15" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[6px] font-medium uppercase tracking-widest text-ink/35 ml-0.5">Category</label>
                        <div className="grid grid-cols-2 gap-1">
                          {[{ v: 'product', l: 'Product' }, { v: 'shipping', l: 'Shipping' }, { v: 'payment', l: 'Payment' }, { v: 'other', l: 'Other' }].map(cat => (
                            <motion.button
                              key={cat.v}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setCategory(cat.v)}
                              className={`py-1.5 rounded-lg text-[7px] font-medium uppercase tracking-widest border transition-all duration-150 ${category === cat.v ? 'border-rose text-rose bg-rose/5' : 'border-ink/5 text-ink/25'}`}
                            >
                              {cat.l}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startNewTicket}
                        className="w-full bg-ink text-white py-2.5 rounded-xl text-[8px] font-medium uppercase tracking-[0.2em] mt-1 hover:bg-rose transition-colors duration-200"
                      >
                        Open Ticket
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full overflow-hidden"
                  >
                    <div className="p-2.5 border-b border-ink/5 flex items-center justify-between bg-white">
                      <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveTab('home')}
                        className="text-rose"
                      >
                        <ArrowLeft size={12} strokeWidth={1.5} />
                      </motion.button>
                      <div className="text-center">
                        <p className="text-[8px] font-medium text-ink uppercase truncate max-w-[140px]">{activeTicket?.subject}</p>
                        <p className="text-[6px] font-medium text-ink/20 uppercase tracking-widest">#{activeTicket?.id.split('-')[0]}</p>
                      </div>
                      <div className="w-4" />
                    </div>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar bg-ink/[0.01]">
                      {chatMessages.map((m, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] px-2.5 py-1.5 rounded-xl text-[9px] leading-relaxed ${m.sender_role === 'customer' ? 'bg-ink text-white rounded-br-none' : 'bg-white border border-ink/5 text-ink rounded-bl-none'}`}>
                            {m.message}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="p-3 bg-white border-t border-ink/5 space-y-1.5">
                      <div className="flex items-end gap-1.5">
                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={message}
                          onChange={(e) => {
                            if (e.target.value.length <= 500) {
                              setMessage(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder="Type message..."
                          className="flex-1 bg-ink/[0.02] border border-ink/[0.08] rounded-[5px] py-2.5 px-3.5 text-[11px] font-medium outline-none placeholder:text-ink/20 focus:bg-white focus:border-rose/30 transition-all resize-none min-h-[40px] focus:shadow-md"
                        />
                        <button
                          onClick={() => sendMessage()}
                          className="w-8 h-10 flex items-center justify-center text-ink/20 hover:text-rose transition-all duration-300 flex-shrink-0 active:scale-90"
                          aria-label="Send message"
                        >
                          <Send size={13} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="flex justify-end px-0.5">
                        <p className={cn('text-[5.5px] font-medium tracking-widest uppercase', message.length > 450 ? 'text-rose' : 'text-ink/15')}>
                          {message.length}/500
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}