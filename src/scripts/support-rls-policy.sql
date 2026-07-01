-- ============================================================
-- NINOC Support Center — RLS Policy Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Drop existing policies (safe to re-run) ──────────────
DROP POLICY IF EXISTS "Allow authenticated insert" ON support_tickets;
DROP POLICY IF EXISTS "Allow authenticated read own" ON support_tickets;
DROP POLICY IF EXISTS "Allow guest insert" ON support_tickets;
DROP POLICY IF EXISTS "Allow guest read" ON support_tickets;
DROP POLICY IF EXISTS "Allow admin all" ON support_tickets;
DROP POLICY IF EXISTS "Allow admin update" ON support_tickets;

DROP POLICY IF EXISTS "Allow authenticated insert" ON support_messages;
DROP POLICY IF EXISTS "Allow guest insert" ON support_messages;
DROP POLICY IF EXISTS "Allow guest read" ON support_messages;
DROP POLICY IF EXISTS "Allow admin all" ON support_messages;
DROP POLICY IF EXISTS "Allow admin update" ON support_messages;

-- ── 2. support_tickets policies ────────────────────────────

-- Authenticated users: insert their own tickets
CREATE POLICY "Allow authenticated insert"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Authenticated users: read only their own tickets
CREATE POLICY "Allow authenticated read own"
ON support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Guest users: insert tickets (user_id = null allowed)
CREATE POLICY "Allow guest insert"
ON support_tickets FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Guest users: read tickets where user_id is null (public/guest tickets)
CREATE POLICY "Allow guest read"
ON support_tickets FOR SELECT
TO anon, authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

-- Admin: full access
CREATE POLICY "Allow admin all"
ON support_tickets FOR ALL
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

-- Admin: update tickets (status, flagged fields)
CREATE POLICY "Allow admin update"
ON support_tickets FOR UPDATE
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

-- ── 3. support_messages policies ──────────────────────────

-- Authenticated users: insert messages to their own tickets
CREATE POLICY "Allow authenticated insert"
ON support_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

-- Guest users: insert messages to guest tickets (user_id IS NULL)
CREATE POLICY "Allow guest insert"
ON support_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = ticket_id AND user_id IS NULL
  )
);

-- All users: read messages from their own tickets
CREATE POLICY "Allow guest read"
ON support_messages FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = ticket_id
 AND (user_id IS NULL OR user_id = auth.uid())
  )
);

-- Admin: full access to messages
CREATE POLICY "Allow admin all"
ON support_messages FOR ALL
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

-- ── 4. placeholder_configs policies ───────────────────────

-- Everyone can read placeholders
CREATE POLICY "Allow read placeholders"
ON placeholder_configs FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Only admin can insert/update/delete
CREATE POLICY "Allow admin manage placeholders"
ON placeholder_configs FOR ALL
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

-- ── 5. Verify ─────────────────────────────────────────────
SELECT 'Policies created successfully' AS status;
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
