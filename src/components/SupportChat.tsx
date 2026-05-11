"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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


  const scrollRef = useRef<HTMLDivElement>(null);

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
    
    // Check if a general ticket already exists
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

  return (
    <div className="fixed bottom-5 right-5 z-[500]">
      {/* MICRO TRIGGER - 14px icon per manifesto */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 bg-ink rounded-full shadow-lg flex items-center justify-center hover:bg-rose transition-colors duration-300"
      >
        {/* Subtle breathe pulse */}
        <motion.div
          className="absolute inset-0 bg-rose rounded-full opacity-0"
          animate={{ scale: [1, 1.3, 1], opacity: [0, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <X size={14} strokeWidth={1.5} className="text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
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
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-4 space-y-4 overflow-y-auto no-scrollbar h-full"
                >
                  <div className="bg-ink/[0.03] p-3.5 rounded-xl border border-ink/5">
                    <p className="text-[9px] font-medium text-ink/50 leading-relaxed mb-2.5 italic">Need help with an archive order?</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab('new_ticket')}
                      className="w-full bg-ink text-white py-2 rounded-lg text-[8px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-rose transition-colors duration-200"
                    >
                      <MessageSquare size={10} /> New Ticket
                    </motion.button>
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className="text-[6px] font-medium uppercase tracking-[0.1em] text-ink/15">Active Conversations</p>
                    {tickets.length > 0 ? (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar">
                        {tickets.map((t, i) => (
                          <motion.button
                            key={t.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => openTicket(t)}
                            className="w-full flex items-center justify-between p-2.5 bg-white border border-ink/5 rounded-lg hover:border-rose/20 transition-all duration-200 text-left group"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[8px] font-medium text-ink uppercase truncate">{t.subject}</p>
                              <p className="text-[6px] font-medium text-ink/25 uppercase tracking-widest">#{t.id.split('-')[0]} • {t.status}</p>
                            </div>
                            <ChevronRight size={10} className="text-ink/10 group-hover:text-rose transition-colors duration-200 ml-2 flex-shrink-0" />
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[7px] font-medium text-ink/15 italic text-center py-4">Empty archive.</p>
                    )}
                  </div>

                  {/* DIRECT INQUIRY INPUT */}
                  <div className="pt-4 border-t border-ink/5">
                    <div className="bg-ink p-3 rounded-xl space-y-2 shadow-xl shadow-ink/10">
                      <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/40">Direct Archive Inquiry</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && startGeneralChat()}
                          placeholder="Type your message..."
                          className="flex-1 bg-white/5 border-none rounded-lg py-1.5 px-3 text-[9px] font-medium text-white outline-none placeholder:text-white/10"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={startGeneralChat}
                          className="w-7 h-7 bg-rose text-white rounded-lg flex items-center justify-center hover:bg-rose-600 transition-colors duration-200 flex-shrink-0"
                        >
                          <Send size={10} />
                        </motion.button>
                      </div>
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
                        {[{v:'product',l:'Product'}, {v:'shipping',l:'Shipping'}, {v:'payment',l:'Payment'}, {v:'other',l:'Other'}].map(cat => (
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
                  <div className="p-2.5 bg-white border-t border-ink/5 flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Message..."
                      className="flex-1 bg-ink/5 border-none rounded-full py-1.5 px-3.5 text-[9px] font-medium outline-none placeholder:text-ink/15"
                    />
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => sendMessage()}
                      className="w-7 h-7 bg-ink text-white rounded-full flex items-center justify-center hover:bg-rose transition-colors duration-200 flex-shrink-0"
                    >
                      <Send size={10} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}