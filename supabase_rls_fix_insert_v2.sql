-- ============================================================
-- FIX INSERT POLICIES (INSERT hanya pakai WITH CHECK, tanpa USING)
-- Run di Supabase Dashboard → SQL Editor
-- ============================================================

-- customer_profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
CREATE POLICY "Users can insert own profile" ON customer_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- orders
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- order_items
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items" ON order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- support_tickets
DROP POLICY IF EXISTS "Users can insert own tickets" ON support_tickets;
CREATE POLICY "Users can insert own tickets" ON support_tickets
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- support_messages
DROP POLICY IF EXISTS "Users can insert own ticket messages" ON support_messages;
CREATE POLICY "Users can insert own ticket messages" ON support_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- products (authenticated only)
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
CREATE POLICY "Authenticated users can insert products" ON products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'INSERT'
ORDER BY tablename;