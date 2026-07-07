"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// legacy imports removed
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

function QuickIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'Truck':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 8 23 16 16 16 16 13 1 13"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case 'RefreshCw':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
    case 'Package':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.5 3.5"/><path d="m21 21-5.97-5.97a8.04 8.04 0 0 0-.91-11.6 8.1 8.1 0 0 0-12.22 0 8.06 8.06 0 0 0 .91 11.6l5.97 5.97"/><path d="M3.27 6.96 8 12l4.73-5.04"/><path d="M20.73 17 16 12l4.73-5.04"/></svg>;
    case 'CreditCard':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>;
    case 'MessageSquare':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'AlertCircle':
      return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

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
  sender_id: string | null;
  sender_role: 'customer' | 'admin';
  message: string;
  created_at: string;
  is_auto_reply?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendAutoReply(ticketId: string, content: string): Promise<void> {
  await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_role: 'admin',
    message: content,
    is_auto_reply: true,
  });
}

async function sendCustomerNotification(ticketId: string, message: string): Promise<void> {
  await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_role: 'admin',
    message,
    is_auto_reply: true,
  });
}

const urlRegex = /(https?:\/\/[^\s]+)/g;

function renderMessageWithLinks(text: string, isCustomer: boolean) {
  if (!text) return null;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      // Membersihkan tanda baca di akhir URL jika AI memasukkannya
      const urlStr = part.replace(/[.,;?!]+$/, '');
      const trailingPunc = part.slice(urlStr.length);

      let label = "Buka Tautan";
      if (urlStr.includes('/shop/')) label = "Lihat Produk";
      else if (urlStr.includes('/retur')) label = "Info Tracking / Retur";
      else if (urlStr.includes('/help')) label = "Info Lengkap / Bantuan";
      else if (urlStr.includes('ninoc.store')) label = "Kunjungi Website";
      
      const isInternal = urlStr.startsWith('https://ninoc.store') || urlStr.startsWith('http://localhost');
      const href = isInternal ? urlStr.replace(/^https?:\/\/[^/]+/, '') || '/' : urlStr;

      const linkClass = cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 mt-1.5 mb-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 mx-0.5 whitespace-nowrap",
        isCustomer ? "bg-white text-ink hover:bg-white/90" : "bg-ink text-white hover:bg-ink/90"
      );

      return (
        <span key={i}>
          {isInternal ? (
            <Link href={href} className={linkClass}>
              {label} <ChevronRight size={12} strokeWidth={2.5} />
            </Link>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {label} <ChevronRight size={12} strokeWidth={2.5} />
            </a>
          )}
          {trailingPunc}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

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
  const [lastNotif, setLastNotif] = useState<{ subject: string; message: string } | null>(null);
  const [autoReplySentSet, setAutoReplySentSet] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUnreadRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dispatch unread count to other components
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('support-unread-count', { detail: notifCount }));
  }, [notifCount]);

  // ─── Fetch tickets
  const fetchTickets = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setTickets(data);
  }, []);

  // ─── Open ticket
  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setActiveTab('chat');
    setAutoReplySentSet(new Set());
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    hasUnreadRef.current = false;
    setNotifCount(0);
  }, []);

  // ─── Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          fetchTickets(user.id);
        }
      } catch {
        console.log('[Support] Guest mode active.');
      }
    };
    fetchUser();
  }, [fetchTickets]);

  // ─── Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('support-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: 'sender_role=eq.admin',
        },
        async (payload) => {
          const newMsg = payload.new as SupportMessage;
          const isRelevant = activeTicket?.id === newMsg.ticket_id || tickets.some(t => t.id === newMsg.ticket_id);
          if (!isRelevant) return;

          if (activeTab === 'chat' && activeTicket?.id === newMsg.ticket_id) {
            setChatMessages(prev => {
              if (prev.some(m => m.id === newMsg.id || (m.sender_role === 'admin' && m.message === newMsg.message))) return prev;
              return [...prev, newMsg];
            });
            return;
          }

          hasUnreadRef.current = true;
          setNotifCount(prev => prev + 1);
          const relevantTicket = activeTicket?.id === newMsg.ticket_id ? activeTicket : tickets.find(t => t.id === newMsg.ticket_id);
          setLastNotif({
            subject: relevantTicket?.subject || 'Status Update',
            message: newMsg.message,
          });
          setShowNotifCard(true);
          setTimeout(() => setShowNotifCard(false), 6000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTicket, tickets, activeTab]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };
  useEffect(() => { adjustHeight(); }, [message, activeTab]);

  // Listen for external open events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-chat', handleOpen);
    return () => window.removeEventListener('open-support-chat', handleOpen);
  }, []);

  // ─── Start new ticket
  const startNewTicket = async () => {
    if (!subject || !category) return;
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id || null,
        subject,
        order_id: orderId || null,
        category,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    if (data) {
      setTickets(prev => [data, ...prev]);
      setActiveTicket(data);
      setActiveTab('chat');
      setChatMessages([]);
      setAutoReplySentSet(new Set());
      setMessage('');
      setSubject('');
      setOrderId('');
      setCategory('');
    }
  };

  // ─── Clear Chat History
  const clearHistory = async () => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus semua riwayat percakapan?");
    if (!confirmDelete) return;

    if (user) {
      // Delete user's tickets from the database
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[clearHistory] Error:', error);
        alert('Gagal menghapus riwayat. Silakan coba lagi nanti.');
        return;
      }
    }

    // Clear local state
    setTickets([]);
    if (activeTab === 'chat') setActiveTab('home');
    setChatMessages([]);
  };

  // ─── Send message + auto-reply
  const processAutoReply = async (ticketId: string, msgText: string) => {
    const replyKey = `${ticketId}|${msgText}`;
    if (autoReplySentSet.has(replyKey)) return;

    setAutoReplySentSet(prev => {
      const next = new Set(prev);
      next.add(replyKey);
      return next;
    });

    setIsTyping(true);

    try {
      const response = await fetch('/api/support/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, message: msgText }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      const responseText = data.response || 'Terima kasih telah menghubungi kami! Tim kami akan segera membalas pesan Anda. Mohon ditunggu ya! 😊';

      // Robust UI update: Ensure AI response appears immediately upon HTTP completion
      // even if Supabase Real-time drops, slows down, or is blocked by RLS for guest users.
      if (responseText) {
        setChatMessages(prev => {
          if (prev.some(m => m.sender_role === 'admin' && m.message === responseText)) {
            return prev;
          }
          const tempAiMsg: SupportMessage = {
            id: `ai-res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            ticket_id: ticketId,
            sender_id: null,
            sender_role: 'admin',
            message: responseText,
            is_auto_reply: true,
            created_at: new Date().toISOString(),
          };
          return [...prev, tempAiMsg];
        });
      }
      
    } catch (error) {
      console.error('Failed to get AI reply:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (overrideMessage?: string, overrideTicket?: SupportTicket) => {
    const msgToSend = overrideMessage || message;
    const targetTicket = overrideTicket || activeTicket;

    if (!msgToSend.trim() || !targetTicket) return;

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: targetTicket.id,
        sender_id: null,
        sender_role: 'customer',
        message: msgToSend.trim(),
      })
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

      // Trigger auto-reply
      await processAutoReply(targetTicket.id, msgToSend.trim());
    }
  };

  // ─── General chat (no ticket, auto-creates one)
  const startGeneralChat = async () => {
    if (!message.trim()) return;

    const msgToSend = message;
    const tempId = `guest-${Date.now()}`;

    // Optimistic UI
    const optimisticMsg: SupportMessage = {
      id: tempId,
      ticket_id: tempId,
      sender_id: null,
      sender_role: 'customer',
      message: msgToSend,
      created_at: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setMessage('');

    try {
      // Check if General Inquiry ticket exists
      let genTicket = tickets.find(t => t.subject === 'General Inquiry');

      if (!genTicket) {
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user?.id || null,
            subject: 'General Inquiry',
            category: 'general',
            status: 'open',
          })
          .select()
          .single();

        if (ticketError) {
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          const errorMsg: SupportMessage = {
            id: `err-${Date.now()}`,
            ticket_id: tempId,
            sender_id: null,
            sender_role: 'admin',
            message: 'Maaf, gagal membuat tiket. Silakan coba lagi atau login terlebih dahulu.',
            created_at: new Date().toISOString(),
            is_auto_reply: true,
          };
          setChatMessages(prev => [...prev, errorMsg]);
          return;
        }

        if (ticketData) {
          genTicket = ticketData;
          setTickets(prev => [ticketData, ...prev]);
        }
      }

      if (genTicket) {
        const { data: savedMsg, error: msgError } = await supabase
          .from('support_messages')
          .insert({
            ticket_id: genTicket.id,
            sender_id: null,
            sender_role: 'customer',
            message: msgToSend,
          })
          .select()
          .single();

        if (msgError) {
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          return;
        }

        if (savedMsg) {
          setChatMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
          setActiveTicket(genTicket);
          setActiveTab('chat');
          await processAutoReply(genTicket.id, msgToSend);
        }
      }
    } catch (err) {
      console.error('[startGeneralChat] Error:', err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ─── Static QUICK_ACTIONS since AUTO_REPLY_CONFIG is removed
  const QUICK_ACTIONS = [
    {
      id: 'shipping',
      label: 'Lacak Pesanan',
      sublabel: 'nomor Order ID atau resi pengiriman',
      icon: 'Truck',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-500',
      subject: 'Tracking Pesanan',
      category: 'shipping',
      placeholder: 'Ketik nomor Order ID atau resi pengiriman...',
    },
    {
      id: 'return',
      label: 'Retur & Refund',
      sublabel: 'nomor Order ID atau nama produk',
      icon: 'RefreshCw',
      color: 'bg-rose/5 border-rose/10',
      iconColor: 'text-rose',
      subject: 'Pengajuan Retur / Refund',
      category: 'return',
      placeholder: 'Ketik nomor Order ID atau keluhan produk...',
    },
    {
      id: 'product',
      label: 'Info Produk',
      sublabel: 'nama barang atau stok',
      icon: 'Package',
      color: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-500',
      subject: 'Informasi Produk',
      category: 'product',
      placeholder: 'Tanya soal bahan, ukuran, atau stok...',
    },
    {
      id: 'payment',
      label: 'Pembayaran',
      sublabel: 'konfirmasi bayar / kendala',
      icon: 'CreditCard',
      color: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-500',
      subject: 'Kendala Pembayaran',
      category: 'payment',
      placeholder: 'Tanya soal metode bayar, cicilan, dsb...',
    },
  ];

  // Hide on admin/checkout pages to prevent overlay interference
  const isCheckoutPage = pathname?.startsWith('/checkout');
  if (isAdminPage || isCheckoutPage) return null;

  return (
    <>
      {/* ─── Notification Card ─── */}
      <AnimatePresence>
        {showNotifCard && lastNotif && activeTab !== 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 right-6 z-[600] w-[300px] bg-white rounded-2xl shadow-2xl border border-ink/5 overflow-hidden"
          >
            <div className="bg-ink px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose rounded-full animate-pulse" />
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">Balasan Studio</p>
              </div>
              <button onClick={() => setShowNotifCard(false)} className="text-white/50 hover:text-white transition-colors" aria-label="Tutup Notifikasi">
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs md:text-[10px] font-medium text-rose uppercase tracking-widest">Pesan Baru</p>
              <p className="text-sm md:text-[11px] font-medium text-ink uppercase italic">{lastNotif.subject}</p>
              <p className="text-sm md:text-[11px] font-medium text-ink/50 leading-relaxed line-clamp-2">{lastNotif.message}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowNotifCard(false);
                  const t = tickets.find(t => t.subject === lastNotif.subject);
                  if (t) {
                    setIsOpen(true);
                    openTicket(t);
                  }
                }}
                className="w-full bg-rose text-white py-2.5 rounded-lg text-xs md:text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors"
              >
                <MessageSquare size={12} /> Buka Bantuan
              </motion.button>
            </div>
            <div className="h-[2px] bg-ink/5">
              <motion.div className="h-full bg-rose" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 6, ease: 'linear' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating Button ─── */}
      <div className="fixed right-5 z-[500] bottom-24 md:bottom-5 hidden md:block">
        <AnimatePresence>
          {notifCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-rose text-white text-[11px] md:text-[8px] font-medium rounded-full w-5 h-5 flex items-center justify-center shadow-lg z-10"
            >
              {notifCount > 9 ? '9+' : notifCount}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) setShowNotifCard(false); }}
          className="relative w-9 h-9 bg-ink rounded-full shadow-lg flex items-center justify-center hover:bg-rose transition-colors duration-150 ease-out active:scale-95"
        >
          <motion.div
            className="absolute inset-0 bg-rose rounded-full opacity-0"
            animate={notifCount > 0 ? { scale: [1, 1.4, 1], opacity: [0, 0.3, 0] } : { scale: [1, 1.3, 1], opacity: [0, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <MessageSquare size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ─── Chat Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 0, y: '100%' } : { opacity: 0, y: 8, scale: 0.96 }}
            animate={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { opacity: 0, y: '100%' } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-[600] bg-white shadow-2xl overflow-hidden border border-ink/5 flex flex-col origin-bottom md:origin-bottom-right",
              "bottom-0 left-0 right-0 h-[80vh] rounded-t-3xl md:bottom-12 md:right-5 md:left-auto md:w-[400px] md:h-[600px] md:rounded-2xl"
            )}
          >
            {/* Backdrop for mobile */}
            <div className="md:hidden absolute inset-0 bg-ink/20 backdrop-blur-sm -z-10" onClick={() => setIsOpen(false)} />

            {/* Header */}
            <motion.div className="bg-ink p-4 text-white relative flex-shrink-0" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between pr-10">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full", user ? "bg-emerald-500" : "bg-white/70 animate-pulse")} />
                    Dukungan NINOC
                  </p>
                  <h3 className="text-xs font-semibold uppercase tracking-widest">Pusat <span className="text-white/80">Bantuan</span></h3>
                </div>
                {user && (
                  <p className="text-[9px] font-medium text-white/30 uppercase tracking-widest truncate max-w-[80px]">{user.email?.split('@')[0]}</p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-1/2 -translate-y-1/2 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors duration-200 active:scale-95 focus:outline-none shadow-sm cursor-pointer"
                aria-label="Tutup Pusat Bantuan"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </motion.div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* ─── HOME TAB ─── */}
              {activeTab === 'home' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col flex-1 h-full w-full overflow-hidden bg-white">
                  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                    {/* Quick Action Grid */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/60 mb-3">Pilih Kategori Bantuan</p>
                      <div className="grid grid-cols-2 gap-2 mt-4 px-1">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => {
                              setSubject(action.subject);
                              setCategory(action.category);
                              setActiveTab('new_ticket');
                            }}
                            className={cn("flex flex-col items-start gap-1.5 p-3 rounded-xl border transition-all duration-150 ease-out text-left active:scale-[0.97] cursor-pointer", action.color, "hover:shadow-sm hover:-translate-y-0.5")}
                          >
                            <QuickIcon name={action.icon} className={action.iconColor} />
                            <div>
                              <p className="text-xs md:text-[9px] font-semibold uppercase tracking-wide leading-tight">{action.label}</p>
                              <p className="text-[11px] md:text-[9px] opacity-60 leading-snug">{action.sublabel}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Conversations */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/50">Riwayat Percakapan</p>
                        {tickets.length > 0 && (
                          <button
                            onClick={clearHistory}
                            className="text-[9px] font-bold uppercase tracking-widest text-rose hover:text-rose-600 transition-colors active:scale-95"
                          >
                            Hapus Riwayat
                          </button>
                        )}
                      </div>
                      {tickets.length > 0 ? (
                        <div className="space-y-1">
                          {tickets.slice(0, 5).map((t, i) => (
                            <motion.button
                              key={t.id}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => openTicket(t)}
                              className="w-full flex items-center justify-between p-2.5 bg-ink/[0.02] border border-ink/5 rounded-xl hover:bg-ink/[0.04] hover:border-ink/10 transition-all duration-150 ease-out text-left group active:scale-[0.98] cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] md:text-[11px] font-medium text-ink uppercase truncate">{t.subject === 'General Inquiry' ? 'Pertanyaan Umum' : t.subject}</p>
                                <p className="text-[9px] font-medium text-ink/50 uppercase tracking-widest mt-0.5">#{t.id.split('-')[0]} · {t.status}</p>
                              </div>
                              <ChevronRight size={12} className="text-ink/10 group-hover:text-rose transition-colors duration-200 ml-2 flex-shrink-0" />
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 opacity-25">
                          <MessageSquare size={18} strokeWidth={1} />
                          <p className="text-xs md:text-[10px] italic text-ink/60 uppercase tracking-widest">Belum ada riwayat percakapan</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Input */}
                  <div className="relative z-10 p-4 bg-white border-t border-ink/5 shrink-0">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={message}
                      onChange={e => { if (e.target.value.length <= 500) setMessage(e.target.value); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startGeneralChat(); } }}
                      placeholder="Ketik pertanyaan Anda di sini..."
                      className="w-full bg-ink/[0.02] text-ink py-3 px-4 rounded-xl text-sm md:text-xs font-medium outline-none placeholder:text-ink/50 border border-ink/[0.08] transition-all focus:border-ink/30 focus:bg-white resize-none min-h-[48px] focus:shadow-sm"
                    />
                    <div className="flex items-end gap-1 mt-1.5">
                      <p className="flex-1 text-[9px] text-ink/50 uppercase tracking-widest font-semibold">
                        {user ? 'HUBUNGI STUDIO' : 'MODE TAMU — CHAT AKTIF'}
                      </p>
                      <button onClick={startGeneralChat} className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-ink/60 hover:text-rose transition-colors font-semibold cursor-pointer">
                        Kirim <Send size={12} />
                      </button>
                      <span className={cn('text-[9px] font-semibold tracking-widest', message.length > 450 ? 'text-rose' : 'text-ink/50')}>
                        {message.length}/500
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── NEW TICKET TAB ─── */}
              {activeTab === 'new_ticket' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 space-y-3 flex-1 flex flex-col justify-center relative bg-white"
                >
                  <button onClick={() => setActiveTab('home')} className="text-xs md:text-[10px] font-semibold uppercase tracking-[0.2em] text-rose flex items-center gap-1 absolute top-4 left-4 cursor-pointer hover:-translate-x-0.5 transition-transform duration-150 active:scale-95">
                    <ArrowLeft size={12} /> Kembali
                  </button>
                  <div className="text-center space-y-1 mb-4 pt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/60">Kategori Terpilih</p>
                    <h4 className="text-sm md:text-xs font-bold uppercase tracking-wider text-ink">{subject === 'General Inquiry' ? 'Pertanyaan Umum' : subject}</h4>
                  </div>
                  <div className="space-y-3 bg-ink/[0.02] p-4 rounded-xl border border-ink/5">
                    <div className="space-y-1.5 text-center">
                      <label className="text-[11px] md:text-[9px] font-semibold uppercase tracking-widest text-ink/50">Punya ID Pesanan? (Opsional)</label>
                      <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Contoh: NCO-12345" className="w-full bg-white border border-ink/10 rounded-lg py-2.5 px-3 text-xs md:text-[10px] font-medium outline-none placeholder:text-ink/20 focus:border-rose/30 focus:shadow-sm transition-[border-color,box-shadow] duration-150 ease-out text-center" />
                    </div>
                    <button onClick={startNewTicket} className="w-full bg-ink text-white py-2.5 rounded-lg text-sm md:text-xs font-semibold uppercase tracking-[0.2em] mt-3 hover:bg-rose transition-colors duration-150 ease-out cursor-pointer active:scale-[0.98]">
                      Mulai Obrolan
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─── CHAT TAB ─── */}
              {activeTab === 'chat' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 h-full w-full overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-3 md:p-4 border-b border-ink/5 flex items-center justify-between bg-white flex-shrink-0">
                    <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 text-ink hover:bg-ink hover:text-white transition-colors duration-150 ease-out cursor-pointer hover:-translate-x-0.5 active:scale-90">
                      <ArrowLeft size={16} strokeWidth={2} />
                    </button>
                    <div className="text-center px-4">
                      <p className="text-sm md:text-xs font-bold text-ink uppercase truncate max-w-[160px] md:max-w-[180px]">{activeTicket?.subject === 'General Inquiry' ? 'Pertanyaan Umum' : activeTicket?.subject}</p>
                      <p className="text-[10px] md:text-[9px] font-semibold text-ink/60 uppercase tracking-widest mt-0.5">ID: #{activeTicket?.id.split('-')[0]}</p>
                    </div>
                    <div className="w-8" />
                  </div>

                  {/* Messages */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar bg-ink/[0.01]">
                    {chatMessages.map((m, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[85%]">
                          <div className={`px-4 py-3 rounded-xl text-sm md:text-xs leading-relaxed whitespace-pre-wrap ${m.sender_role === 'customer' ? 'bg-ink text-white rounded-br-none' : m.is_auto_reply ? 'bg-ink/5 border border-ink/10 text-ink rounded-bl-none' : 'bg-white border border-ink/5 text-ink rounded-bl-none'}`}>
                            {renderMessageWithLinks(m.message, m.sender_role === 'customer')}
                          </div>
                          {(m.sender_role === 'admin' || m.is_auto_reply) && (
                            <div className={`flex items-center gap-1 mt-0.5 ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                              {m.is_auto_reply ? (
                                <span className="text-[9px] text-rose/60 uppercase tracking-widest font-semibold flex items-center gap-0.5">
                                  <Zap size={8} strokeWidth={2.5} /> Auto-reply
                                </span>
                              ) : (
                                <span className="text-[9px] text-ink/50 uppercase tracking-widest font-semibold">Studio</span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="px-3 py-2 rounded-xl text-sm md:text-xs bg-ink/5 text-ink/60 rounded-bl-none flex items-center gap-1.5">
                          <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          <span className="ml-1">NINOC sedang mengetik...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-3 bg-white border-t border-ink/5 space-y-1.5 flex-shrink-0">
                    <div className="flex items-end gap-2">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={e => { if (e.target.value.length <= 500) setMessage(e.target.value); }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Ketik pesan Anda..."
                        className="flex-1 bg-ink/[0.02] border border-ink/[0.08] rounded-xl py-3 px-4 text-sm md:text-xs font-medium outline-none placeholder:text-ink/50 focus:bg-white focus:border-ink/30 transition-[border-color,background-color,shadow] duration-150 ease-out resize-none min-h-[44px] focus:shadow-md"
                      />
                      <button onClick={() => sendMessage()} className="w-11 h-11 bg-ink text-white rounded-xl flex items-center justify-center hover:bg-rose transition-[background-color,transform] duration-150 ease-out flex-shrink-0 active:scale-[0.93] cursor-pointer shadow-sm" aria-label="Kirim pesan">
                        <Send size={16} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex justify-end px-0.5">
                      <p className={cn('text-[9px] font-semibold tracking-widest uppercase', message.length > 450 ? 'text-rose' : 'text-ink/50')}>
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