-- ============================================================
-- NINOC ENTERPRISE — GUEST CHAT POLICY FIX
-- Run di Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- support_tickets: Allow public read/write for guest chat
-- ============================================================

-- Remove existing restrictive policies first
DROP POLICY IF EXISTS "Users read own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Public read open tickets" ON support_tickets;

-- Policy: Anyone (guest + auth user) can SELECT all tickets
DROP POLICY IF EXISTS "Public can read support tickets" ON support_tickets;
CREATE POLICY "Public can read support tickets"
ON support_tickets FOR SELECT
USING (true);

-- Policy: Anyone can INSERT tickets (for guest chat)
DROP POLICY IF EXISTS "Public can create support tickets" ON support_tickets;
CREATE POLICY "Public can create support tickets"
ON support_tickets FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can UPDATE their own tickets
DROP POLICY IF EXISTS "Public can update support tickets" ON support_tickets;
CREATE POLICY "Public can update support tickets"
ON support_tickets FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- support_messages: Allow public read for guest viewing
-- ============================================================

-- Remove existing restrictive policies
DROP POLICY IF EXISTS "Admin can view all support messages" ON support_messages;
DROP POLICY IF EXISTS "Users can insert messages to own tickets" ON support_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON support_messages;

-- Policy: Anyone can SELECT messages (for viewing chat)
DROP POLICY IF EXISTS "Public can read support messages" ON support_messages;
CREATE POLICY "Public can read support messages"
ON support_messages FOR SELECT
USING (true);

-- Policy: Anyone can INSERT messages (for guest sending)
DROP POLICY IF EXISTS "Public can insert support messages" ON support_messages;
CREATE POLICY "Public can insert support messages"
ON support_messages FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can UPDATE messages (mark as read)
DROP POLICY IF EXISTS "Public can update support messages" ON support_messages;
CREATE POLICY "Public can update support messages"
ON support_messages FOR UPDATE
USING (true);

-- ============================================================
-- VERIFIKASI
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