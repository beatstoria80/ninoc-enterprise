-- ============================================================
-- NINOC ENTERPRISE - FIX INSERT POLICIES
-- Tambahkan WITH CHECK yang missing
-- Run di Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- FIX: customer_profiles INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
CREATE POLICY "Users can insert own profile"
ON customer_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FIX: orders INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FIX: order_items INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items"
ON order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- ============================================================
-- FIX: support_tickets INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own tickets" ON support_tickets;
CREATE POLICY "Users can insert own tickets"
ON support_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FIX: support_messages INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own ticket messages" ON support_messages;
CREATE POLICY "Users can insert own ticket messages"
ON support_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- ============================================================
-- FIX: products INSERT (admin only)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
CREATE POLICY "Authenticated users can insert products"
ON products
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  qual IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'INSERT'
ORDER BY tablename;
