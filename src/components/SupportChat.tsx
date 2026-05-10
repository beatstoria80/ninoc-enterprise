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

  const sendMessage = async () => {
    if (!message.trim() || !activeTicket || !user) return;
    const newMessage = {
      ticket_id: activeTicket.id,
      sender_id: user.id,
      sender_role: 'customer' as const,
      message: message.trim()
    };
    const { data } = await supabase
      .from('support_messages')
      .insert(newMessage)
      .select()
      .single();
    if (data) {
      setChatMessages([...chatMessages, data]);
      setMessage('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-[300px] h-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-ink/5 flex flex-col"
          >
            {/* COMPACT HEADER */}
            <div className="bg-ink p-5 text-white relative">
              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X size={16} /></button>
              <div className="space-y-0.5">
                <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-white/40">NINOC Support</p>
                <h3 className="text-sm font-display font-medium italic uppercase tracking-widest">Support <span className="text-rose">Archive</span></h3>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'home' && (
                <div className="p-5 space-y-4 overflow-y-auto no-scrollbar h-full">
                  <div className="bg-ink/[0.03] p-4 rounded-xl border border-ink/5">
                    <p className="text-[10px] font-medium text-ink/60 leading-relaxed mb-3 italic">Need help with an archive order?</p>
                    <button onClick={() => setActiveTab('new_ticket')} className="w-full bg-ink text-white py-2.5 rounded-lg text-[9px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose transition-all">
                      <MessageSquare size={12} /> New Ticket
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[7px] font-medium uppercase tracking-[0.1em] text-ink/20">Active Conversations</p>
                    {tickets.length > 0 ? (
                      tickets.map((t) => (
                        <button key={t.id} onClick={() => openTicket(t)} className="w-full flex items-center justify-between p-3 bg-white border border-ink/5 rounded-lg hover:border-rose/20 transition-all text-left group">
                          <div className="min-w-0">
                            <p className="text-[9px] font-medium text-ink uppercase truncate">{t.subject}</p>
                            <p className="text-[7px] font-medium text-ink/30 uppercase tracking-widest">#{t.id.split('-')[0]} • {t.status}</p>
                          </div>
                          <ChevronRight size={12} className="text-ink/10 group-hover:text-rose transition-all" />
                        </button>
                      ))
                    ) : (
                      <p className="text-[8px] font-medium text-ink/20 italic">Empty archive.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'new_ticket' && (
                <div className="p-5 space-y-4 flex-1 overflow-y-auto no-scrollbar">
                  <button onClick={() => setActiveTab('home')} className="text-[8px] font-medium uppercase tracking-[0.2em] text-rose flex items-center gap-1">
                    <ArrowLeft size={10} /> Back
                  </button>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[7px] font-medium uppercase tracking-widest text-ink/40 ml-1">Subject</label>
                      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="..." className="w-full bg-ink/5 border-none rounded-lg py-2 px-3 text-[10px] font-medium outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] font-medium uppercase tracking-widest text-ink/40 ml-1">Order ID</label>
                      <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="NINOC-..." className="w-full bg-ink/5 border-none rounded-lg py-2 px-3 text-[10px] font-medium outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] font-medium uppercase tracking-widest text-ink/40 ml-1">Category</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[{v:'product',l:'Product'}, {v:'shipping',l:'Shipping'}, {v:'payment',l:'Payment'}, {v:'other',l:'Other'}].map(cat => (
                          <button key={cat.v} onClick={() => setCategory(cat.v)} className={`py-2 rounded-lg text-[8px] font-medium uppercase tracking-widest border transition-all ${category === cat.v ? 'border-rose text-rose bg-rose/5' : 'border-ink/5 text-ink/30'}`}>
                            {cat.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={startNewTicket} className="w-full bg-ink text-white py-3 rounded-xl text-[9px] font-medium uppercase tracking-[0.2em] mt-2">Open Ticket</button>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-3 border-b border-ink/5 flex items-center justify-between bg-white">
                    <button onClick={() => setActiveTab('home')} className="text-rose"><ArrowLeft size={14} /></button>
                    <div className="text-center">
                      <p className="text-[9px] font-medium text-ink uppercase truncate max-w-[150px]">{activeTicket?.subject}</p>
                      <p className="text-[7px] font-medium text-ink/20 uppercase tracking-widest">#{activeTicket?.id.split('-')[0]}</p>
                    </div>
                    <div className="w-4" />
                  </div>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-ink/[0.01]">
                    {chatMessages.map((m, idx) => (
                      <div key={idx} className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-2.5 rounded-xl text-[10px] leading-relaxed ${m.sender_role === 'customer' ? 'bg-ink text-white rounded-br-none' : 'bg-white border border-ink/5 text-ink rounded-bl-none'}`}>
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white border-t border-ink/5 flex gap-2">
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Message..." className="flex-1 bg-ink/5 border-none rounded-full py-2 px-4 text-[10px] font-medium outline-none" />
                    <button onClick={sendMessage} className="w-8 h-8 bg-ink text-white rounded-full flex items-center justify-center hover:bg-rose transition-colors flex-shrink-0">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-rose text-white rounded-full shadow-xl flex items-center justify-center hover:bg-rose/90 transition-all"
      >
        <AnimatePresence mode="wait">
          {isOpen ? <X key="close" size={14} /> : <MessageSquare key="open" size={14} />}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
