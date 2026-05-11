-- ============================================================
-- NINOC ENTERPRISE - RLS POLICIES
-- Row Level Security untuk keamanan database
-- Run ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. PRODUCTS TABLE
-- ============================================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read (semua orang bisa lihat produk)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT USING (true);

-- Only authenticated users can insert (admin process)
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
CREATE POLICY "Authenticated users can insert products"
ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
CREATE POLICY "Authenticated users can delete products"
ON products FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. VARIANTS TABLE
-- ============================================================

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Variants are viewable by everyone" ON variants;
CREATE POLICY "Variants are viewable by everyone"
ON variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage variants" ON variants;
CREATE POLICY "Authenticated users can manage variants"
ON variants FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. CUSTOMER_PROFILES TABLE
-- ============================================================

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON customer_profiles;
CREATE POLICY "Users can view own profile"
ON customer_profiles FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;
CREATE POLICY "Users can update own profile"
ON customer_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile (signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
CREATE POLICY "Users can insert own profile"
ON customer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. ORDERS TABLE
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own orders
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (cancel, etc)
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 5. ORDER_ITEMS TABLE
-- ============================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own order items (via orders join)
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Users can insert their own order items
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items"
ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Users can update their own order items
DROP POLICY IF EXISTS "Users can update own order items" ON order_items;
CREATE POLICY "Users can update own order items"
ON order_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- ============================================================
-- 6. SUPPORT_TICKETS TABLE
-- ============================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets"
ON support_tickets FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own tickets
DROP POLICY IF EXISTS "Users can insert own tickets" ON support_tickets;
CREATE POLICY "Users can insert own tickets"
ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
CREATE POLICY "Users can update own tickets"
ON support_tickets FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 7. SUPPORT_MESSAGES TABLE
-- ============================================================

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

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
ON support_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Users can update their own messages
DROP POLICY IF EXISTS "Users can update own messages" ON support_messages;
CREATE POLICY "Users can update own messages"
ON support_messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- ============================================================
-- 8. TRACKING_LOGS TABLE
-- ============================================================

ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;

-- Users can view tracking for their own orders
DROP POLICY IF EXISTS "Users can view own tracking" ON tracking_logs;
CREATE POLICY "Users can view own tracking"
ON tracking_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = tracking_logs.order_id
    AND orders.user_id = auth.uid()
  )
);

-- ============================================================
-- 9. ATELIER_SETTINGS TABLE (Admin only)
-- ============================================================

ALTER TABLE atelier_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view
DROP POLICY IF EXISTS "Authenticated users can view settings" ON atelier_settings;
CREATE POLICY "Authenticated users can view settings"
ON atelier_settings FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can manage
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON atelier_settings;
CREATE POLICY "Authenticated users can manage settings"
ON atelier_settings FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- VERIFIKASI
-- ============================================================

-- Cek semua policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
