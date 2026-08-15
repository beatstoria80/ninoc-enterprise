-- Migration: Create retur_messages for Admin-Supplier dispute center
CREATE TABLE IF NOT EXISTS public.retur_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retur_id UUID REFERENCES public.retur_requests(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'supplier')),
  sender_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.retur_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read retur_messages" ON public.retur_messages FOR SELECT USING (true);
CREATE POLICY "Allow all insert retur_messages" ON public.retur_messages FOR INSERT WITH CHECK (true);
