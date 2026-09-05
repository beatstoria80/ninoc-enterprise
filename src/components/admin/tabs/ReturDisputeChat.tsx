import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ReturDisputeChat({ returId, isReadOnly = false }: { returId: string, isReadOnly?: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = React.useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('retur_messages')
      .select('*')
      .eq('retur_id', returId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
    setIsLoading(false);
  }, [returId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`admin_chat_${returId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'retur_messages',
        filter: `retur_id=eq.${returId}`
      }, payload => {
        setMessages(prev => {
          // Prevent duplicates if optimistic UI already added it (naive check by message content)
          if (prev.some(m => m.message === payload.new.message && new Date(payload.new.created_at).getTime() - new Date(m.created_at).getTime() < 5000)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [returId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isReadOnly) return;

    const msg = messageInput.trim();
    setMessageInput('');

    // Optimistic UI
    const tempMsg = {
      id: Math.random().toString(),
      retur_id: returId,
      sender_role: 'admin',
      message: msg,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const { error } = await supabase.from('retur_messages').insert({
      retur_id: returId,
      sender_role: 'admin',
      message: msg
    });

    if (error) {
      loadMessages(); // rollback on error
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xs border border-ink/10 overflow-hidden relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-ink/10 bg-gradient-to-r from-ink/[0.02] to-white flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose/10 flex items-center justify-center text-rose">
            <MessageSquare size={16} className="fill-current opacity-20" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Complaint Chat</h3>
            <p className="text-[10px] font-medium text-ink/60 uppercase tracking-widest mt-0.5">Customer &bull; Admin</p>
          </div>
        </div>
        {isReadOnly && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-ink/5 text-ink/50 rounded-md border border-ink/10 flex items-center gap-1.5 shadow-xs">
            <ShieldAlert size={12} /> Read Only
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 minimal-scroll">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40">
            <MessageSquare size={32} strokeWidth={1} className="text-ink/50" />
            <p className="text-xs font-bold uppercase tracking-widest text-ink/70">Belum ada percakapan</p>
            <p className="text-[10px] font-medium text-ink/50 max-w-[200px] leading-relaxed">
              Kirimkan pesan pertama ke pelanggan terkait detail komplain retur.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id} 
                  className={cn("flex flex-col", isAdmin ? 'items-end' : 'items-start')}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs font-medium",
                    isAdmin 
                      ? "bg-ink text-white rounded-tr-sm" 
                      : "bg-white border border-ink/10 text-ink rounded-tl-sm"
                  )}>
                    {msg.message}
                  </div>
                  <div className={cn("flex items-center gap-1.5 mt-1.5 px-1", isAdmin ? "flex-row-reverse" : "")}>
                    <span className="text-[10px] text-ink/50 font-mono font-medium">
                      {new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} &bull; {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                    {isAdmin && <CheckCircle size={10} className="text-emerald-500" />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 bg-white border-t border-ink/10 z-10 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input 
            type="text" 
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            disabled={isReadOnly}
            placeholder={isReadOnly ? "Percakapan ditutup..." : "Ketik pesan ke pelanggan..."}
            className="flex-1 bg-ink/[0.03] border border-ink/10 rounded-xl px-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose/30 transition-all placeholder:text-ink/40 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={!messageInput.trim() || isReadOnly}
            className="bg-rose text-white p-3 rounded-xl hover:bg-pink-600 disabled:opacity-50 disabled:bg-ink/10 disabled:text-ink/40 transition-all shadow-xs group"
          >
            <Send size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
