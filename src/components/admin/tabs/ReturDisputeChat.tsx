import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';

export function ReturDisputeChat({ returId }: { returId: string }) {
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
        setMessages(prev => [...prev, payload.new]);
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
    if (!messageInput.trim()) return;

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
    <div className="space-y-2 mt-6">
      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
        <MessageSquare size={16} className="text-blue-500" />
        Supplier Dispute Center
      </h3>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-[300px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 minimal-scroll bg-slate-50/50 rounded-t-lg">
          {isLoading ? (
            <div className="text-center py-4 text-xs text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              No messages. You can use this space to communicate directly with the supplier.
            </div>
          ) : (
            messages.map(msg => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    isAdmin 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 mx-1">
                    {isAdmin ? 'You (Admin)' : 'Supplier'} • {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-3 bg-white border-t border-gray-100 rounded-b-lg">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Message supplier..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button 
              type="submit"
              disabled={!messageInput.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
