-- ============================================================
-- NINOC ARCHIVE — COMPLETE PRODUCTION SCHEMA v2
-- Updated: 2024-05-10
-- ============================================================

-- 1. Cleanup existing tables (in dependency order)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customer_profiles;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS atelier_settings;
DROP TABLE IF EXISTS tracking_logs;

-- 2. Cleanup existing types
DROP TYPE IF EXISTS main_category_type;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- 3. Category enum (updated to match frontend)
CREATE TYPE main_category_type AS ENUM ('pakaian', 'utilities', 'aksesoris');

-- 4. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  category main_category_type NOT NULL DEFAULT 'pakaian',
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
-- ORDERS
-- ============================================================

-- 6. Orders (updated with payment_status and midtrans_id)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  total_price BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed', 'expired')),
  midtrans_id TEXT,
  payment_url TEXT,
  snap_token TEXT,
  shipping_address JSONB,
  courier TEXT,
  tracking_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE orders IS 'Customer orders with auto-incrementing order_number for easy reference';
COMMENT ON COLUMN orders.order_number IS 'Unique sequential order number (ORD-001, ORD-002, etc.)';

-- 7. Order Items (line items for each order)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  variant_id UUID REFERENCES variants(id),
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- CUSTOMER & SUPPORT
-- ============================================================

-- 8. Customer Profiles (extended user data)
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  customer_number INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) UNIQUE NOT NULL,
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

COMMENT ON TABLE customer_profiles IS 'Customer archive with auto-incrementing customer_number for easy reference';
COMMENT ON COLUMN customer_profiles.customer_number IS 'Unique sequential number for easy customer management (CST-001, CST-002, etc.)';

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
-- SAMPLE DATA (Products)
-- ============================================================

-- Insert sample products
INSERT INTO products (name, slug, description, price, category, image_url, is_featured) VALUES
(
  'Essential Oversized Tee',
  'essential-oversized-tee',
  'Premium cotton oversized tee with relaxed fit. Perfect for everyday wear with minimalist design.',
  350000,
  'pakaian',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  true
),
(
  'Archive Cargo Pants',
  'archive-cargo-pants',
  'Structured cargo pants with multiple pockets. Technical fabric meets streetwear aesthetic.',
  585000,
  'pakaian',
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
  true
),
(
  'Minimal Crossbody Bag',
  'minimal-crossbody-bag',
  'Compact crossbody bag in genuine leather. Features adjustable strap and hidden compartment.',
  425000,
  'aksesoris',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
  false
),
(
  'Utility Cap',
  'utility-cap',
  'Structured six-panel cap with embroidered logo. Premium cotton twill construction.',
  185000,
  'aksesoris',
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
  false
);

-- Insert variants for each product
INSERT INTO variants (product_id, size, color, stock_quantity)
SELECT id, 'S', 'Black', 15 FROM products WHERE slug = 'essential-oversized-tee'
UNION ALL SELECT id, 'M', 'Black', 20 FROM products WHERE slug = 'essential-oversized-tee'
UNION ALL SELECT id, 'L', 'Black', 12 FROM products WHERE slug = 'essential-oversized-tee'
UNION ALL SELECT id, 'XL', 'Black', 8 FROM products WHERE slug = 'essential-oversized-tee'
UNION ALL SELECT id, 'S', 'White', 10 FROM products WHERE slug = 'essential-oversized-tee'
UNION ALL SELECT id, 'M', 'White', 15 FROM products WHERE slug = 'essential-oversized-tee'
UNION ALL SELECT id, 'L', 'White', 10 FROM products WHERE slug = 'essential-oversized-tee'
UNION ALL SELECT id, 'S', 'Black', 10 FROM products WHERE slug = 'archive-cargo-pants'
UNION ALL SELECT id, 'M', 'Black', 15 FROM products WHERE slug = 'archive-cargo-pants'
UNION ALL SELECT id, 'L', 'Black', 8 FROM products WHERE slug = 'archive-cargo-pants'
UNION ALL SELECT id, 'XL', 'Black', 5 FROM products WHERE slug = 'archive-cargo-pants'
UNION ALL SELECT id, 'One Size', 'Black', 25 FROM products WHERE slug = 'minimal-crossbody-bag'
UNION ALL SELECT id, 'One Size', 'Black', 30 FROM products WHERE slug = 'utility-cap'
UNION ALL SELECT id, 'One Size', 'Navy', 20 FROM products WHERE slug = 'utility-cap';

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

-- Tracking logs: webhook can insert, users can read their order logs
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

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_tracking_logs_order_id ON tracking_logs(order_id);
CREATE INDEX idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX idx_customer_profiles_customer_number ON customer_profiles(customer_number);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atelier_settings_updated_at BEFORE UPDATE ON atelier_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();