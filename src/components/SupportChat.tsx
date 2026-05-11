"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, ChevronRight, ArrowLeft, Plus } from 'lucide-react';
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
}

export default function SupportChat() {
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
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    // Mark messages as read when opening
    hasUnreadRef.current = false;
    setNotifCount(0);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchTickets(user.id);
      }
    };
    fetchUser();
  }, [fetchTickets]);

  // Real-time subscription for new admin messages
  useEffect(() => {
    if (!user) return;

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
          // Only notify if this message belongs to one of our tickets
          const userTicket = tickets.find(t => t.id === newMsg.ticket_id);
          if (!userTicket) return;

          // Don't show if we're already in chat tab looking at this ticket
          if (activeTab === 'chat' && activeTicket?.id === newMsg.ticket_id) {
            // Just append to chat
            setChatMessages(prev => [...prev, newMsg]);
            return;
          }

          // Show notification card + badge
          hasUnreadRef.current = true;
          setNotifCount(prev => prev + 1);
          setLastNotif({
            subject: userTicket.subject,
            message: newMsg.message,
            from: 'Studio'
          });
          setShowNotifCard(true);

          // Auto-hide notification card after 6 seconds
          setTimeout(() => {
            setShowNotifCard(false);
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, tickets, activeTab, activeTicket]);

  // Auto-hide notif card when chat is open
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (activeTab === 'chat') {
      setShowNotifCard(false);
    }
  }, [activeTab]);

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

    if (!msgToSend.trim() || !targetTicket || !user) return;

    const newMessage = {
      ticket_id: targetTicket.id,
      sender_id: user.id,
      sender_role: 'customer' as const,
      message: msgToSend.trim()
    };

    const { data } = await supabase
      .from('support_messages')
      .insert(newMessage)
      .select()
      .single();

    if (data) {
      if (activeTicket?.id === targetTicket.id) {
        setChatMessages([...chatMessages, data]);
      }
      setMessage('');
    }
  };

  const startGeneralChat = async () => {
    if (!message.trim() || !user) return;
    if (message.length > 500) return;

    let genTicket = tickets.find(t => t.subject === 'General Inquiry');

    if (!genTicket) {
      const { data } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: 'General Inquiry',
          category: 'other',
          status: 'open'
        })
        .select()
        .single();
      if (data) {
        genTicket = data;
        setTickets([data, ...tickets]);
      }
    }

    if (genTicket) {
      const msg = message;
      await openTicket(genTicket);
      await sendMessage(msg, genTicket);
    }
  };

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

  return (
    <>
      {/* ================================================ */}
      {/* CENTER-SCREEN NOTIFICATION CARD (Top Right) */}
      {/* ================================================ */}
      <AnimatePresence>
        {showNotifCard && lastNotif && (
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
                <MessageSquare size={10} /> Open Archive
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
      {/* MICRO TRIGGER - 14px icon per manifesto */}
      {/* ================================================ */}
      <div className="fixed bottom-5 right-5 z-[500]">
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

        {/* COMPACT PANEL - 300x480 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-12 right-0 w-[300px] h-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-ink/5 flex flex-col"
            >
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
                <div className="space-y-0.5">
                  <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/30">NINOC Support</p>
                  <h3 className="text-xs font-display font-medium italic uppercase tracking-widest">Support <span className="text-rose">Archive</span></h3>
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
                        <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-ink/20">Archival Support</p>
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
                            <p className="text-[8px] font-medium uppercase tracking-[0.3em] italic">Archive Empty</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PROMINENT BOTTOM INPUT - WHATSAPP STYLE */}
                    <div className="p-4 bg-white border-t border-ink/5 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.02)] space-y-2">
                      <div className="relative group">
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
                          className="w-full bg-ink text-white py-3 pl-4 pr-12 rounded-[5px] text-[10px] font-medium outline-none placeholder:text-white/20 shadow-xl shadow-ink/10 transition-all focus:ring-1 focus:ring-rose/30 resize-none no-scrollbar min-h-[44px]"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={startGeneralChat}
                          className="absolute right-2 bottom-2 w-8 h-8 bg-rose text-white rounded-[5px] flex items-center justify-center hover:bg-rose-600 transition-colors duration-300 shadow-lg shadow-rose/20"
                        >
                          <Send size={12} />
                        </motion.button>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <p className="text-[6px] font-medium uppercase tracking-[0.3em] text-ink/20">Studio Direct Channel</p>
                        <p className={cn('text-[6px] font-medium tracking-widest uppercase', message.length > 450 ? 'text-rose' : 'text-ink/20')}>
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
                    <div className="p-4 bg-white border-t border-ink/5 space-y-2">
                      <div className="relative group flex items-end gap-2">
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
                          className="flex-1 bg-ink/5 border-none rounded-[5px] py-3 px-4 text-[10px] font-medium outline-none placeholder:text-ink/20 focus:ring-1 focus:ring-ink/10 transition-all resize-none no-scrollbar min-h-[44px]"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => sendMessage()}
                          className="w-10 h-10 bg-ink text-white rounded-[5px] flex items-center justify-center hover:bg-rose transition-all duration-300 shadow-lg shadow-ink/10 flex-shrink-0 mb-0.5"
                        >
                          <Send size={14} />
                        </motion.button>
                      </div>
                      <div className="flex justify-end px-1">
                        <p className={cn('text-[6px] font-medium tracking-widest uppercase', message.length > 450 ? 'text-rose' : 'text-ink/20')}>
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
      </div>
    </>
  );
}