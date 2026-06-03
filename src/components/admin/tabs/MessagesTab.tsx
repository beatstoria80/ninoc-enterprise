import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatSession } from '../types';
import { supabase } from '@/lib/supabase';

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
  return (
    <motion.div
      key="messages"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-h-0 flex gap-6 pb-4"
    >
      {/* Chat List */}
      <div className="w-80 bg-white rounded-[5px] border border-ink/5 flex flex-col overflow-hidden shadow-sm">
        <div className="p-5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
          <div>
            <h3 className="text-[10px] font-medium text-ink uppercase tracking-[0.2em]">Customer Inquiries</h3>
            <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1.5">{chatSessions.length} sessions active</p>
          </div>
          <div className="w-1.5 h-1.5 bg-rose rounded-full animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {chatSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                setActiveChatSession(session);
              }}
              className={cn(
                "w-full p-5 text-left border-b border-ink/[0.03] transition-all duration-300 group relative",
                activeChatSession?.id === session.id ? "bg-ink/[0.02]" : "hover:bg-ink/[0.01]"
              )}
            >
              {activeChatSession?.id === session.id && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose" />
              )}
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[9px] font-medium text-ink uppercase truncate pr-4">{session.customer_name}</span>
                <span className="text-[6px] text-ink/20 uppercase font-medium">{new Date(session.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[8px] text-ink/40 truncate flex-1 leading-snug lowercase tracking-tight">{session.last_message}</p>
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
              <p className="text-[8px] font-medium uppercase tracking-[0.3em] italic">No active inquiries</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-[5px] border border-ink/5 flex flex-col overflow-hidden shadow-sm">
        {activeChatSession ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-ink rounded-[5px] flex items-center justify-center text-white text-[10px] font-medium">
                  {activeChatSession.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-[10px] font-medium text-ink uppercase tracking-[0.2em]">{activeChatSession.customer_name}</h3>
                  <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1">Email: {activeChatSession.customer_email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-1.5 border border-ink/10 rounded-[5px] text-[7px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose hover:border-rose transition-all duration-300"
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
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === 'admin' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[70%] group",
                    msg.sender === 'admin' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-[5px] text-[10px] leading-relaxed",
                      msg.sender === 'admin' 
                        ? "bg-ink text-white shadow-lg shadow-ink/5" 
                        : "bg-ink/[0.03] text-ink border border-ink/5"
                    )}>
                      {msg.message}
                    </div>
                    <div className={cn(
                      "mt-2 flex items-center gap-2",
                      msg.sender === 'admin' ? "flex-row-reverse" : "flex-row"
                    )}>
                      <span className="text-[6px] font-medium text-ink/20 uppercase tracking-widest">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.sender === 'admin' && (
                        <span className={cn("text-[6px] font-medium uppercase tracking-widest", msg.is_read ? "text-rose" : "text-ink/10")}>
                          {msg.is_read ? 'PROCESSED' : 'SENT'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-ink/5 bg-white">
              <div className="flex items-end gap-1.5">
                <textarea
                  rows={1}
                  value={newMessage}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setNewMessage(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type archival response..."
                  className="flex-1 bg-ink/[0.02] text-ink py-2.5 px-3.5 rounded-[5px] text-[11px] font-medium outline-none border border-ink/[0.08] placeholder:text-ink/20 transition-all focus:bg-white focus:border-rose/30 resize-none no-scrollbar min-h-[40px]"
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
              <div className="flex justify-between items-center mt-2 px-0.5">
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
            <p className="text-[10px] font-medium uppercase tracking-[0.5em] italic">Select inquiry to respond</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
