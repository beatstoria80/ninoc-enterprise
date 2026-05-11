-- ============================================================
-- NINOC ENTERPRISE - RLS CLEANUP & FIX
-- Hapus policies berbahaya & duplicate
-- Run di Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- HAPUS SEMUA PUBLIC_* POLICIES (BERBAHAYA!)
-- ============================================================

-- atelier_settings
DROP POLICY IF EXISTS "public_read_settings" ON atelier_settings;
DROP POLICY IF EXISTS "public_update_settings" ON atelier_settings;
DROP POLICY IF EXISTS "public_upsert_settings" ON atelier_settings;

-- customer_profiles
DROP POLICY IF EXISTS "public_insert_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "public_read_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "public_update_profiles" ON customer_profiles;

-- order_items
DROP POLICY IF EXISTS "public_insert_order_items" ON order_items;
DROP POLICY IF EXISTS "public_read_order_items" ON order_items;

-- orders
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
DROP POLICY IF EXISTS "public_read_orders" ON orders;
DROP POLICY IF EXISTS "public_update_orders" ON orders;

-- products
DROP POLICY IF EXISTS "public_read_products" ON products;

-- support_messages
DROP POLICY IF EXISTS "public_insert_messages" ON support_messages;
DROP POLICY IF EXISTS "public_read_messages" ON support_messages;
DROP POLICY IF EXISTS "public_update_messages" ON support_messages;
DROP POLICY IF EXISTS "public_delete_messages" ON support_messages;

-- support_tickets
DROP POLICY IF EXISTS "public_insert_tickets" ON support_tickets;
DROP POLICY IF EXISTS "public_read_tickets" ON support_tickets;
DROP POLICY IF EXISTS "public_update_tickets" ON support_tickets;
DROP POLICY IF EXISTS "public_delete_tickets" ON support_tickets;

-- tracking_logs
DROP POLICY IF EXISTS "public_insert_tracking" ON tracking_logs;
DROP POLICY IF EXISTS "public_read_tracking" ON tracking_logs;

-- variants
DROP POLICY IF EXISTS "public_read_variants" ON variants;

-- ============================================================
-- HAPUS DUPLICATE POLICIES
-- ============================================================

-- support_messages duplicates
DROP POLICY IF EXISTS "Users can see own messages" ON support_messages;
DROP POLICY IF EXISTS "Users can view own ticket messages" ON support_messages;

-- support_tickets duplicates
DROP POLICY IF EXISTS "Users can see own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;

-- orders duplicates
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- ============================================================
-- FIX INSERT POLICIES (yang null qualifier)
-- ============================================================

-- customer_profiles - fix INSERT with proper check
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
CREATE POLICY "Users can insert own profile"
ON customer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- orders - fix INSERT with proper check
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- order_items - fix INSERT with proper check
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- support_tickets - fix INSERT with proper check
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON support_tickets;
CREATE POLICY "Users can insert own tickets"
ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- support_messages - fix INSERT with proper check
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

-- tracking_logs - disable public insert (admin only via API/webhook)
DROP POLICY IF EXISTS "Users can insert tracking" ON tracking_logs;
DROP POLICY IF EXISTS "Users can create tracking" ON tracking_logs;
DROP POLICY IF EXISTS "Tracking insert for own orders" ON tracking_logs;

-- ============================================================
-- VERIFIKASI - CEK POLICIES TERAKHIR
-- ============================================================

SELECT
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NULL THEN 'WITH CHECK (no check!)' ELSE 'OK' END as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
