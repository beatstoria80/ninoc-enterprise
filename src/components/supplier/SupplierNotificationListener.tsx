"use client";

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function SupplierNotificationListener({ userId }: { userId: string }) {
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Realtime subscription for notifications
    const channel = supabase
      .channel('supplier_notifications')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        }, 
        payload => {
          const notif = payload.new;
          toast.success(notif.title, {
            description: notif.message,
            duration: 8000,
            action: notif.action_link ? {
              label: 'View',
              onClick: () => window.location.href = notif.action_link
            } : undefined
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return null; // This is a headless component just for listening
}
