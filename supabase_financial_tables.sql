-- ============================================================
-- NINOC ENTERPRISE - FINANCIAL TABLES MIGRATION
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. PRODUCT COSTING
-- Track complete cost breakdown per product
-- ============================================================
CREATE TABLE IF NOT EXISTS product_costing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_cost NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  packaging_cost NUMERIC(12,2) DEFAULT 0,
  operasional_pct NUMERIC(5,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 11,
  courier_regency_cost NUMERIC(12,2) DEFAULT 0,
  courier_inter_regency_cost NUMERIC(12,2) DEFAULT 0,
  courier_same_day_cost NUMERIC(12,2) DEFAULT 0,
  courier_instant_cost NUMERIC(12,2) DEFAULT 0,
  target_margin_pct NUMERIC(5,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

COMMENT ON TABLE product_costing IS 'Product cost breakdown for margin & pricing analysis';
COMMENT ON COLUMN product_costing.supplier_cost IS 'Base cost from supplier';
COMMENT ON COLUMN product_costing.operasional_pct IS 'Operational cost percentage';
COMMENT ON COLUMN product_costing.tax_rate IS 'Tax rate percentage (default 11% for Indonesia)';

-- ============================================================
-- 2. SUPPLIER COST LOG
-- Audit trail for supplier cost changes
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  old_supplier_cost NUMERIC(12,2) NOT NULL,
  new_supplier_cost NUMERIC(12,2) NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE supplier_cost_log IS 'Audit trail for supplier cost changes per product';

-- ============================================================
-- 3. PROMO IMPACT
-- Track promo/discount impact on product margins
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  promo_name TEXT NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE promo_impact IS 'Promo and discount impact tracking per product';

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- product_costing: Admin can manage, public can read
ALTER TABLE product_costing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_costing_select" ON product_costing;
CREATE POLICY "product_costing_select" ON product_costing FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_costing_admin_all" ON product_costing;
CREATE POLICY "product_costing_admin_all" ON product_costing FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- supplier_cost_log: Admin full, public read
ALTER TABLE supplier_cost_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplier_cost_log_select" ON supplier_cost_log;
CREATE POLICY "supplier_cost_log_select" ON supplier_cost_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "supplier_cost_log_admin_all" ON supplier_cost_log;
CREATE POLICY "supplier_cost_log_admin_all" ON supplier_cost_log FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- promo_impact: Admin full, public read active only
ALTER TABLE promo_impact ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_impact_select" ON promo_impact;
CREATE POLICY "promo_impact_select" ON promo_impact FOR SELECT USING (true);

DROP POLICY IF EXISTS "promo_impact_admin_all" ON promo_impact;
CREATE POLICY "promo_impact_admin_all" ON promo_impact FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================================
-- AUTO-UPDATE TIMESTAMP FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to product_costing
DROP TRIGGER IF EXISTS update_product_costing_updated_at ON product_costing;
CREATE TRIGGER update_product_costing_updated_at
  BEFORE UPDATE ON product_costing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE DATA (optional - uncomment to insert)
-- ============================================================
-- INSERT INTO product_costing (product_id, supplier_cost, shipping_cost, packaging_cost, operasional_pct, tax_rate, selling_price)
-- SELECT id, 0, 0, 0, 0, 11, price FROM products LIMIT 5;