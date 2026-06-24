-- ============================================================
-- SCRIPT TO FIX SUPABASE RLS VULNERABILITIES
-- RUN THIS IN YOUR SUPABASE DASHBOARD -> SQL EDITOR
-- ============================================================

-- 1. Enable RLS on core tables if not already enabled
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_profiles ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCTS & VARIANTS
-- Public can read. Only Admins can modify.
DROP POLICY IF EXISTS "Products viewable by everyone" ON products;
CREATE POLICY "Products viewable by everyone" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products admin full access" ON products;
CREATE POLICY "Products admin full access" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

DROP POLICY IF EXISTS "Variants viewable by everyone" ON variants;
CREATE POLICY "Variants viewable by everyone" ON variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Variants admin full access" ON variants;
CREATE POLICY "Variants admin full access" ON variants FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- 3. COLLECTIONS
-- Public can read. Only Admins can modify.
DROP POLICY IF EXISTS "Collections viewable by everyone" ON collections;
CREATE POLICY "Collections viewable by everyone" ON collections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Collections admin full access" ON collections;
CREATE POLICY "Collections admin full access" ON collections FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

DROP POLICY IF EXISTS "Collection Products viewable by everyone" ON collection_products;
CREATE POLICY "Collection Products viewable by everyone" ON collection_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Collection Products admin full access" ON collection_products;
CREATE POLICY "Collection Products admin full access" ON collection_products FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- 4. PRODUCT REVIEWS
-- Public can read. Authenticated users can insert. Admins and authors can edit/delete.
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON product_reviews;
CREATE POLICY "Reviews viewable by everyone" ON product_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reviews insertable by authenticated users" ON product_reviews;
CREATE POLICY "Reviews insertable by authenticated users" ON product_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Reviews editable by author or admin" ON product_reviews;
CREATE POLICY "Reviews editable by author or admin" ON product_reviews FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- 5. ORDERS & ORDER ITEMS
-- Users can read/insert their own orders. Admins have full access.
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Users can insert orders" ON orders;
CREATE POLICY "Users can insert orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to orders" ON orders;
CREATE POLICY "Admins have full access to orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR auth.uid() IS NULL))
);

DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to order items" ON order_items;
CREATE POLICY "Admins have full access to order items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- 6. CUSTOMER PROFILES
-- Users can view and insert their own profile. Admins have full access.
DROP POLICY IF EXISTS "Users can view their own customer profile" ON customer_profiles;
CREATE POLICY "Users can view their own customer profile" ON customer_profiles FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Users can insert their customer profile" ON customer_profiles;
CREATE POLICY "Users can insert their customer profile" ON customer_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to customers" ON customer_profiles;
CREATE POLICY "Admins have full access to customers" ON customer_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

SELECT 'Row-Level Security has been successfully enabled and policies applied.' as Status;
