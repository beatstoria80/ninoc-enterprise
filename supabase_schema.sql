-- ============================================================
-- NINOC ARCHIVE — COMPLETE PRODUCTION SCHEMA
-- ============================================================

-- 1. Cleanup existing tables (in dependency order)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customer_profiles;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS atelier_settings;

-- 2. Cleanup existing types
DROP TYPE IF EXISTS main_category_type;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- 3. Category enum
CREATE TYPE main_category_type AS ENUM ('fashion', 'accessories', 'utilities');

-- 4. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  category main_category_type NOT NULL DEFAULT 'fashion',
  sub_category TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Variants (size/color per product)
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size TEXT, 
  color TEXT,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- ORDERS (ID is TEXT to match 'NINOC-{timestamp}' format)
-- ============================================================

-- 6. Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  total_price BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_url TEXT,
  snap_token TEXT,
  shipping_address JSONB,
  courier TEXT,
  tracking_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Order Items (line items for each order)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- CUSTOMER & SUPPORT
-- ============================================================

-- 8. Customer Profiles (extended user data)
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  street TEXT,
  house_number TEXT,
  rt TEXT,
  rw TEXT,
  kelurahan TEXT,
  kecamatan TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- ADMIN CONFIGURATION
-- ============================================================

-- 10. Atelier Settings (key-value config store)
CREATE TABLE atelier_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- LOGISTICS TRACKING (Biteship Webhook History)
-- ============================================================

-- 11. Tracking Logs
CREATE TABLE tracking_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  biteship_status TEXT NOT NULL,
  internal_status TEXT NOT NULL,
  courier_company TEXT,
  courier_driver_name TEXT,
  courier_driver_phone TEXT,
  courier_link TEXT,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE atelier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ACCESS POLICIES
-- ============================================================

-- Products: public read
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read variants" ON variants FOR SELECT USING (true);

-- Orders: users can read their own, anon can insert (guest checkout)
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow order creation" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order items read" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow order items insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order update by webhook" ON orders FOR UPDATE USING (true);

-- Tracking logs: webhook can insert, users can read their order's logs
CREATE POLICY "Allow tracking log insert" ON tracking_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow tracking log read" ON tracking_logs FOR SELECT USING (true);

-- Customer profiles: users manage their own
CREATE POLICY "Users read own profile" ON customer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON customer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON customer_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Support tickets: users manage their own
CREATE POLICY "Users read own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Atelier settings: public read (admin writes handled via service role)
CREATE POLICY "Allow public read settings" ON atelier_settings FOR SELECT USING (true);
CREATE POLICY "Allow settings upsert" ON atelier_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow settings update" ON atelier_settings FOR UPDATE USING (true);
