-- ============================================================
-- NINOC: Operational Expenses & Low-Stock Alert System
-- ============================================================

-- 1. Operational Expenses Table
CREATE TABLE IF NOT EXISTS operational_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- packaging, shipping_subsidy, marketing, salary, rent, utilities, software, equipment, other
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON operational_expenses FOR ALL USING (true);

-- 2. Add reorder_point column to variants table (for Low-Stock Alert)
ALTER TABLE variants ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 5;
