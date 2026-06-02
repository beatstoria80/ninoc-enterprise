-- ============================================================
-- NINOC ADMIN — MIGRATION SCRIPT v3 (sync with AdminDashboard)
-- Run this after supabase_schema.sql
-- Target: Supabase SQL Editor or migration pipeline
-- ============================================================

-- ============================================================
-- 1. ADD MISSING COLUMNS TO PRODUCTS
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS perspective1 TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS perspective2 TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS perspective3 TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS perspective4 TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_tag TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;

-- ============================================================
-- 2. ADD MISSING COLUMNS TO SUPPORT_TICKETS
-- ============================================================

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category TEXT;

-- ============================================================
-- 3. NEW TABLE: PRODUCT COSTING (Pricing Calculator)
-- ============================================================

CREATE TABLE IF NOT EXISTS product_costing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  supplier_cost BIGINT DEFAULT 0,
  shipping_cost BIGINT DEFAULT 0,
  packaging_cost BIGINT DEFAULT 0,
  operasional_pct NUMERIC(5,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 11,
  courier_regency_cost BIGINT DEFAULT 0,
  courier_inter_regency_cost BIGINT DEFAULT 0,
  courier_same_day_cost BIGINT DEFAULT 0,
  courier_instant_cost BIGINT DEFAULT 0,
  target_margin_pct NUMERIC(5,2) DEFAULT 20,
  selling_price BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id)
);

COMMENT ON TABLE product_costing IS 'Product pricing calculator — supplier cost, shipping, margins';

-- ============================================================
-- 4. NEW TABLE: SUPPLIER COST LOG (Audit Trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_cost_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  old_supplier_cost BIGINT NOT NULL,
  new_supplier_cost BIGINT NOT NULL,
  change_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE supplier_cost_log IS 'Audit trail for supplier cost changes';

-- ============================================================
-- 5. NEW TABLE: PROMO IMPACT (Promo Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS promo_impact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  promo_name TEXT NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  discount_amount BIGINT DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE promo_impact IS 'Track promo/discount impact on products';

-- ============================================================
-- 6. NEW TABLE: SUPPORT MESSAGES (Chat Thread)
-- ============================================================

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  sender_role TEXT DEFAULT 'customer' CHECK (sender_role IN ('customer', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE support_messages IS 'Chat messages linked to support tickets';

-- ============================================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE product_costing ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_cost_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. ACCESS POLICIES FOR NEW TABLES
-- ============================================================

-- product_costing: admin only (service role reads/writes)
CREATE POLICY "Admin read product_costing" ON product_costing FOR SELECT USING (true);
CREATE POLICY "Admin insert product_costing" ON product_costing FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update product_costing" ON product_costing FOR UPDATE USING (true);

-- supplier_cost_log: admin only
CREATE POLICY "Admin read supplier_cost_log" ON supplier_cost_log FOR SELECT USING (true);
CREATE POLICY "Admin insert supplier_cost_log" ON supplier_cost_log FOR INSERT WITH CHECK (true);

-- promo_impact: public read, admin writes
CREATE POLICY "Public read promo_impact" ON promo_impact FOR SELECT USING (true);
CREATE POLICY "Admin insert promo_impact" ON promo_impact FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update promo_impact" ON promo_impact FOR UPDATE USING (true);

-- support_messages: ticket owner / admin
CREATE POLICY "Users read own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
    OR auth.uid() IS NOT NULL  -- admin via service role
  );

CREATE POLICY "Users insert own messages" ON support_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id OR auth.uid() IS NOT NULL);

-- ============================================================
-- 9. INDEXES FOR NEW TABLES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_product_costing_product_id ON product_costing(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cost_log_product_id ON supplier_cost_log(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cost_log_changed_at ON supplier_cost_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_impact_product_id ON promo_impact(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_impact_active ON promo_impact(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- ============================================================
-- 10. TRIGGER FOR UPDATED_AT ON NEW TABLES
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_costing_updated_at ON product_costing;
CREATE TRIGGER update_product_costing_updated_at
  BEFORE UPDATE ON product_costing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. STORAGE BUCKET (for product images)
--    Run this via Supabase Dashboard > Storage > New Bucket
--    Or via SQL below (requires superuser):
-- ============================================================

-- NOTE: Creating storage buckets via SQL requires Supabase CLI or Dashboard.
-- Suggested manual setup:
--   Bucket name: "products"
--   Public: YES
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- ============================================================
-- 12. SAMPLE DATA (optional — for testing)
-- ============================================================

-- Sample costing for existing products
INSERT INTO product_costing (product_id, supplier_cost, shipping_cost, packaging_cost, operasional_pct, tax_rate, courier_regency_cost, courier_inter_regency_cost, courier_same_day_cost, courier_instant_cost, target_margin_pct, selling_price)
SELECT id, 150000, 15000, 5000, 15, 11, 12000, 18000, 25000, 35000, 20, 350000
FROM products WHERE slug = 'essential-oversized-tee'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO product_costing (product_id, supplier_cost, shipping_cost, packaging_cost, operasional_pct, tax_rate, courier_regency_cost, courier_inter_regency_cost, courier_same_day_cost, courier_instant_cost, target_margin_pct, selling_price)
SELECT id, 250000, 15000, 8000, 15, 11, 12000, 18000, 25000, 35000, 20, 585000
FROM products WHERE slug = 'archive-cargo-pants'
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================
-- DONE — Run in Supabase SQL Editor
-- ============================================================