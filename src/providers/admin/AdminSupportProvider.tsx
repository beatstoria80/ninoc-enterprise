'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ChatSession, ChatMessage } from '@/components/admin/types';
import { fetchSupportTicketsAction, sendSupportMessageAction, markSupportMessagesReadAction } from '@/app/actions/admin/support';
import { supabase } from '@/lib/supabase';

interface AdminSupportContextType {
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  setActiveChatSession: (session: ChatSession | null) => void;
  isLoading: boolean;
  fetchChatSessions: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  markMessagesAsRead: (ticketId: string) => Promise<void>;
  totalUnreadChats: number;
}

const AdminSupportContext = createContext<AdminSupportContextType | undefined>(undefined);

export function AdminSupportProvider({ children }: { children: ReactNode }) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep latest state in refs for stable websocket callback
  const chatSessionsRef = useRef(chatSessions);
  const activeChatSessionRef = useRef(activeChatSession);

  useEffect(() => { chatSessionsRef.current = chatSessions; }, [chatSessions]);
  useEffect(() => { activeChatSessionRef.current = activeChatSession; }, [activeChatSession]);

  const fetchChatSessions = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchSupportTicketsAction();
    if (result.success && result.tickets) {
      // Map tickets & messages to ChatSession structure
      const ticketsData = result.tickets;
      const allMessages = result.messages || [];

      const sessions: ChatSession[] = ticketsData.map((t: any) => {
        const ticketMessages = allMessages.filter((m: any) => m.ticket_id === t.id) || [];
        return {
          id: t.id,
          customer_name: t.subject || `Inquiry ${t.id.split('-')[0]}`,
          customer_email: t.user_id ? 'Registered User' : 'Guest User',
          category: t.category || 'general',
          last_message: ticketMessages[ticketMessages.length - 1]?.message || 'No messages',
          last_message_time: ticketMessages[ticketMessages.length - 1]?.created_at || t.created_at,
          unread_count: ticketMessages.filter((m: any) => !m.is_read && m.sender_role === 'customer').length,
          status: t.status || 'open',
          crm_status: t.crm_status || 'general',
          priority: t.priority || 'medium',
          assigned_admin: t.assigned_admin || null,
          is_taken_over: t.is_taken_over || false,
          created_at: t.created_at,
          messages: ticketMessages.map((m: any) => ({
            id: m.id,
            sender: m.sender_role as 'customer' | 'admin',
            message: m.message,
            timestamp: m.created_at,
            is_read: m.is_read ?? true,
            is_auto_reply: m.is_auto_reply ?? false
          }))
        };
      });
      setChatSessions(sessions);
    } else {
      console.error('Failed to fetch chat sessions:', result.error);
    }
    setIsLoading(false);
  }, []);

  const markMessagesAsRead = useCallback(async (ticketId: string) => {
    const result = await markSupportMessagesReadAction(ticketId);
    if (result.success) {
      setChatSessions(prev => prev.map(s => s.id === ticketId ? { ...s, unread_count: 0 } : s));
    }
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !activeChatSession) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender: 'admin',
      message: messageText,
      timestamp: new Date().toISOString(),
      is_read: false
    };

    // Optimistic UI
    setChatSessions(prev => prev.map(s =>
      s.id === activeChatSession.id
        ? { ...s, messages: [...s.messages, optimisticMessage], last_message: messageText, last_message_time: optimisticMessage.timestamp }
        : s
    ));
    setActiveChatSession(prev => prev ? { ...prev, messages: [...prev.messages, optimisticMessage], last_message: messageText, last_message_time: optimisticMessage.timestamp } : null);

    const result = await sendSupportMessageAction(activeChatSession.id, messageText);
    
    if (!result.success) {
      alert('Failed to send message: ' + result.error);
      fetchChatSessions(); // Revert on failure
    }
  }, [activeChatSession, fetchChatSessions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChatSessions();
  }, [fetchChatSessions]);

  // ─── Real-time subscription for Admin
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: 'sender_role=eq.customer',
        },
        async (payload) => {
          const newMsg = payload.new;
          const currentSessions = chatSessionsRef.current;
          const currentActive = activeChatSessionRef.current;
          
          const sessionExists = currentSessions.some(s => s.id === newMsg.ticket_id);
          
          if (!sessionExists) {
             fetchChatSessions();
             return;
          }
          
          const optimisticMessage: ChatMessage = {
             id: newMsg.id,
             sender: 'customer',
             message: newMsg.message,
             timestamp: newMsg.created_at,
             is_read: false
          };
          
          setChatSessions(prev => prev.map(s => {
             if (s.id === newMsg.ticket_id) {
                if (s.messages.some(m => m.id === newMsg.id)) return s;
                return {
                   ...s, 
                   messages: [...s.messages, optimisticMessage],
                   last_message: newMsg.message,
                   last_message_time: newMsg.created_at,
                   unread_count: s.unread_count + 1
                };
             }
             return s;
          }));
          
          if (currentActive?.id === newMsg.ticket_id) {
             setActiveChatSession(prev => {
                if (!prev) return prev;
                if (prev.messages.some(m => m.id === newMsg.id)) return prev;
                return {
                   ...prev,
                   messages: [...prev.messages, optimisticMessage],
                   last_message: newMsg.message,
                   last_message_time: newMsg.created_at,
                   unread_count: prev.unread_count + 1
                };
             });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchChatSessions]);

  const totalUnreadChats = chatSessions.reduce((sum, s) => sum + s.unread_count, 0);

  return (
    <AdminSupportContext.Provider value={{
      chatSessions, activeChatSession, setActiveChatSession, isLoading,
      fetchChatSessions, sendMessage, markMessagesAsRead, totalUnreadChats
    }}>
      {children}
    </AdminSupportContext.Provider>
  );
}

export function useAdminSupport() {
  const context = useContext(AdminSupportContext);
  if (context === undefined) {
    throw new Error('useAdminSupport must be used within an AdminSupportProvider');
  }
  return context;
}
