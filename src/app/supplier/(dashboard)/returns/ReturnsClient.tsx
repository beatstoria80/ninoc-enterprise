"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PackageX, AlertTriangle, Video, Search, MessageSquare, X, Send } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function SupplierReturnsClient({
  initialReturns,
  initialCancellations,
  supplierId
}: {
  initialReturns: any[];
  initialCancellations: any[];
  supplierId: string;
}) {
  const [returns, setReturns] = useState(initialReturns);
  const [cancellations, setCancellations] = useState(initialCancellations);
  const [selectedRetur, setSelectedRetur] = useState<any | null>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Realtime subscription for returns updates
    const channel = supabase
      .channel('retur_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retur_requests' }, payload => {
        // Simple refresh strategy: reload window to get fresh server props
        // In a complex app, we'd fetch the specific retur
        toast('Return status updated by Admin');
        router.refresh();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'retur_messages' }, payload => {
        const newMsg = payload.new;
        if (selectedRetur && newMsg.retur_id === selectedRetur.id) {
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_role === 'admin') {
            toast('New message from Admin');
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRetur, supplierId, router, supabase]);

  const loadMessages = React.useCallback(async (returId: string) => {
    setIsLoadingMessages(true);
    const { data, error } = await supabase
      .from('retur_messages')
      .select('*')
      .eq('retur_id', returId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
    setIsLoadingMessages(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedRetur) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedRetur.id);
    }
  }, [selectedRetur, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRetur) return;

    const msg = messageInput.trim();
    setMessageInput('');

    // Optimistic UI
    const tempMsg = {
      id: Math.random().toString(),
      retur_id: selectedRetur.id,
      sender_role: 'supplier',
      message: msg,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const { error } = await supabase.from('retur_messages').insert({
      retur_id: selectedRetur.id,
      sender_role: 'supplier',
      message: msg
    });

    if (error) {
      toast.error('Failed to send message');
      loadMessages(selectedRetur.id); // rollback optimistic
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Returns & Cancellations</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor product returns, refunds, and cancelled orders handled by NINOC Admin.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-full">
              Return Requests ({returns.length})
            </div>
          </div>
          <div className="text-xs text-ink/60 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md border border-amber-200/50 flex items-center gap-2">
            <AlertTriangle size={14} />
            View-Only Access. Return approvals are managed by Central Admin.
          </div>
        </div>

        <div className="p-6">
          {returns.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <PackageX size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">No return requests</p>
              <p className="text-gray-500 text-sm">Your products have a perfect satisfaction rate!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {returns.map(ret => (
                <div key={ret.id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-ink">Order #{ret.order.id}</h3>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          ret.status === 'approved' || ret.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          ret.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {ret.status}
                        </span>
                      </div>
                      <p className="text-xs text-ink/60 mt-1">Requested on {format(new Date(ret.created_at), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedRetur(ret)}
                        className="flex items-center gap-2 text-sm text-ink hover:text-white bg-gray-50 hover:bg-ink transition-colors px-3 py-1.5 rounded-md h-fit border border-gray-200"
                      >
                        <MessageSquare size={16} />
                        Dispute Center
                      </button>
                      {ret.video_url && (
                        <a href={ret.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md h-fit">
                          <Video size={16} />
                          Evidence
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-ink/50 uppercase tracking-wider block">Reason for Return</span>
                        <p className="text-sm font-medium text-ink mt-0.5">{ret.reason_label || 'Defective Product'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink/50 uppercase tracking-wider block">Admin Notes</span>
                        <p className="text-sm text-ink/80 mt-0.5">{ret.admin_notes || 'Pending admin review'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-ink/50 uppercase tracking-wider block mb-2">Affected Items</span>
                      <div className="space-y-2">
                        {ret.supplierItems.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-start text-sm">
                            <div>
                              <p className="font-medium text-ink">{item.product_name}</p>
                              {(item.size || item.color) && (
                                <p className="text-xs text-ink/60">Var: {[item.size, item.color].filter(Boolean).join(', ')}</p>
                              )}
                            </div>
                            <span className="font-medium bg-white px-2 py-0.5 rounded border border-gray-200">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancellations Section */}
      <div className="bg-white border border-gray-200 overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-medium text-ink">Cancelled Orders ({cancellations.length})</h2>
        </div>
        <div className="p-6">
          {cancellations.length === 0 ? (
            <div className="py-8 text-center text-ink/50 text-sm">No cancelled orders found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cancellations.map(order => (
                <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-ink">#{order.id}</p>
                      <p className="text-xs text-ink/60">{format(new Date(order.created_at), 'dd MMM yyyy')}</p>
                    </div>
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Cancelled</span>
                  </div>
                  <div className="space-y-1">
                    {order.supplierItems.map((item: any) => (
                      <div key={item.id} className="text-sm flex justify-between text-ink/80">
                        <span className="truncate pr-2">{item.product_name}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dispute Center Chat Modal */}
      {selectedRetur && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-ink">Dispute Center</h3>
                <p className="text-xs text-ink/60">Order #{selectedRetur.order.id}</p>
              </div>
              <button onClick={() => setSelectedRetur(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 minimal-scroll">
              {isLoadingMessages ? (
                <div className="text-center py-4 text-xs text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center">
                  <MessageSquare size={32} className="text-gray-300 mb-2" />
                  No messages yet. Send a message to NINOC Admin to clarify this return.
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_role === 'supplier';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        isMe ? 'bg-ink text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-ink rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {isMe ? 'You' : 'Admin'} • {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 rounded-b-2xl">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type a message to Admin..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                />
                <button 
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-ink text-white p-2.5 rounded-xl hover:bg-ink/90 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
