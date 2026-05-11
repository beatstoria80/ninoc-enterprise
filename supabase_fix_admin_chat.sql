-- ============================================================
-- NINOC ENTERPRISE — ADMIN SUPPORT CHAT FIX
-- Run di Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: CREATE support_messages RLS POLICIES
-- ============================================================

-- Enable RLS (if not already enabled)
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can SELECT all messages (for dashboard)
DROP POLICY IF EXISTS "Admin can view all support messages" ON support_messages;
CREATE POLICY "Admin can view all support messages"
ON support_messages FOR SELECT
USING (
  -- Allow if sender is authenticated user (customer viewing their own)
  auth.uid() IS NOT NULL
  OR
  -- Allow if ticket belongs to current user
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Policy: Authenticated users can INSERT messages to their own tickets
DROP POLICY IF EXISTS "Users can insert messages to own tickets" ON support_messages;
CREATE POLICY "Users can insert messages to own tickets"
ON support_messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    sender_id = auth.uid()
    OR
    -- Admin can send messages too
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  )
);

-- Policy: Admins can UPDATE (mark as read)
DROP POLICY IF EXISTS "Users can update own messages" ON support_messages;
CREATE POLICY "Users can update own messages"
ON support_messages FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 2: UPDATE support_tickets RLS POLICIES
-- ============================================================

-- Allow users to view their own tickets (existing)
DROP POLICY IF EXISTS "Users read own tickets" ON support_tickets;
CREATE POLICY "Users read own tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create tickets (existing)
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
CREATE POLICY "Users create tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their tickets
DROP POLICY IF EXISTS "Users update own tickets" ON support_tickets;
CREATE POLICY "Users update own tickets"
ON support_tickets FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Allow anonymous (for guest support without login) - read open tickets
DROP POLICY IF EXISTS "Public read open tickets" ON support_tickets;
CREATE POLICY "Public read open tickets"
ON support_tickets FOR SELECT
USING (true);

-- ============================================================
-- STEP 3: VERIFIKASI
-- ============================================================

-- Show all policies
SELECT
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('support_tickets', 'support_messages')
ORDER BY tablename, policyname;

-- Show table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('support_tickets', 'support_messages')
ORDER BY table_name, ordinal_position;