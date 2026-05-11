-- ============================================================
-- NINOC ENTERPRISE — SUPPORT TABLES FIX
-- Run di Supabase Dashboard → SQL Editor
-- Target: https://esiapizmdpylhotojfij.supabase.co
-- ============================================================

-- ============================================================
-- STEP 1: CREATE support_messages TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')) DEFAULT 'customer',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE support_messages IS 'Chat messages per support ticket — NINOC Archive';

-- ============================================================
-- STEP 2: ALTER support_tickets — add missing fields
-- ============================================================

-- Add order_id (nullable)
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS order_id TEXT;

-- Add category
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IN ('product', 'shipping', 'payment', 'other'))
  DEFAULT 'other';

-- Drop old message column if exists (replace with structured messages)
-- Note: we keep message column for backward compat, new system uses support_messages

-- ============================================================
-- STEP 3: CREATE INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id ON support_tickets(order_id);

-- ============================================================
-- STEP 4: ENABLE RLS on support_messages
-- ============================================================
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: RLS POLICIES — support_messages
-- ============================================================

-- Users can view messages for their own tickets
DROP POLICY IF EXISTS "Users can view own ticket messages" ON support_messages;
CREATE POLICY "Users can view own ticket messages"
ON support_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Users can insert messages for their own tickets
DROP POLICY IF EXISTS "Users can insert own ticket messages" ON support_messages;
CREATE POLICY "Users can insert own ticket messages"
ON support_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- ============================================================
-- STEP 6: UPDATE RLS POLICIES — support_tickets
-- ============================================================

-- Allow users to view their own tickets
DROP POLICY IF EXISTS "Users read own tickets" ON support_tickets;
CREATE POLICY "Users read own tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create tickets
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
CREATE POLICY "Users create tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tickets
DROP POLICY IF EXISTS "Users update own tickets" ON support_tickets;
CREATE POLICY "Users update own tickets"
ON support_tickets FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================
-- STEP 7: TRIGGER for updated_at (support_messages)
-- ============================================================
CREATE OR REPLACE FUNCTION update_support_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- support_messages doesn't have updated_at, but we add created_at trigger
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VERIFIKASI: Show all tables & policies
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('support_tickets', 'support_messages')
ORDER BY tablename, policyname;

-- ============================================================
-- VERIFIKASI: Show table structures
-- ============================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'support_tickets'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'support_messages'
ORDER BY ordinal_position;