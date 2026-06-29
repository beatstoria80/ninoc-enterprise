-- Migration: Create user_notifications table for storing customer alerts
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS user_notifications_is_read_idx ON public.user_notifications(user_id, is_read);