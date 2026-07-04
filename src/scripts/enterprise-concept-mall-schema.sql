-- ==============================================================================
-- NINOC ENTERPRISE — CONCEPT MALL & MULTI-ORIGIN WAREHOUSE SCHEMA
-- Run this migration in Supabase Dashboard > SQL Editor
-- This script is idempotent & self-healing (adds missing columns if table pre-exists)
-- ==============================================================================

-- 1. DEPARTMENTS TABLE (Concept Mall Pillars)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  gpc_code VARCHAR(255) NOT NULL, -- Google Product Category taxonomy string
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self-healing: Add columns in case table pre-existed with different schema
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
ADD COLUMN IF NOT EXISTS gpc_code VARCHAR(255) DEFAULT 'Apparel & Accessories > Clothing',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure unique constraint on slug for ON CONFLICT
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'departments_slug_key'
  ) THEN 
    ALTER TABLE departments ADD CONSTRAINT departments_slug_key UNIQUE (slug);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Insert Default Concept Mall Pillars (Apparel, Objects, Pantry/F&B)
INSERT INTO departments (name, slug, gpc_code, description, sort_order) VALUES
('Apparel & Archive', 'apparel', 'Apparel & Accessories > Clothing', 'Industrial and functional garment archival studio collections.', 1),
('Objects & Consumer Goods', 'objects', 'Home & Garden > Kitchen & Dining', 'Everyday utilitarian objects, home accessories, and industrial goods.', 2),
('Pantry & Café (F&B)', 'pantry', 'Food, Beverages & Tobacco > Beverages > Coffee', 'Artisan roasted coffee beans, gourmet snacks, and ready-to-drink beverages.', 3)
ON CONFLICT (slug) DO UPDATE SET
  gpc_code = EXCLUDED.gpc_code,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 2. WAREHOUSES TABLE (Biteship Multi-Origin Pickup Locations)
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  street_address TEXT NOT NULL,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_crossdock_hub BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self-healing: Add missing columns if warehouses table already existed in database
ALTER TABLE warehouses 
ADD COLUMN IF NOT EXISTS name VARCHAR(150),
ADD COLUMN IF NOT EXISTS code VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100) DEFAULT 'NINOC Logistics',
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30) DEFAULT '+628211983774',
ADD COLUMN IF NOT EXISTS street_address TEXT DEFAULT 'Kompleks Griya Saluyu, Blok AA No.87',
ADD COLUMN IF NOT EXISTS district VARCHAR(100) DEFAULT 'Mekarjaya, Rancasari',
ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Kota Bandung',
ADD COLUMN IF NOT EXISTS province VARCHAR(100) DEFAULT 'Jawa Barat',
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10) DEFAULT '40292',
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_crossdock_hub BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure unique constraint on code for ON CONFLICT
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'warehouses_code_key'
  ) THEN 
    ALTER TABLE warehouses ADD CONSTRAINT warehouses_code_key UNIQUE (code);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Insert Official NINOC Warehouses (Griya Saluyu Studio as Primary)
INSERT INTO warehouses (name, code, contact_name, contact_phone, street_address, district, city, province, postal_code, is_primary, is_crossdock_hub) VALUES
('Gudang Utama NINOC (Apparel & Goods)', 'WH-BANDUNG-01', 'NINOC Logistics', '+628211983774', 'Kompleks Griya Saluyu, Blok AA No.87', 'Mekarjaya, Rancasari', 'Kota Bandung', 'Jawa Barat', '40292', true, true),
('NINOC Pantry Roastery Hub (F&B)', 'WH-BANDUNG-FB', 'NINOC Roastery', '+628211983774', 'Kompleks Griya Saluyu, Blok AA No.87', 'Mekarjaya, Rancasari', 'Kota Bandung', 'Jawa Barat', '40292', false, false)
ON CONFLICT (code) DO UPDATE SET
  contact_phone = EXCLUDED.contact_phone,
  street_address = EXCLUDED.street_address,
  district = EXCLUDED.district,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  postal_code = EXCLUDED.postal_code,
  is_crossdock_hub = EXCLUDED.is_crossdock_hub;

-- 3. EXTEND PRODUCTS TABLE FOR CONCEPT MALL & MULTI-ORIGIN WAREHOUSES
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS weight_grams INT DEFAULT 500,
ADD COLUMN IF NOT EXISTS length_cm INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS width_cm INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS height_cm INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS shelf_life_days INT NULL, -- For perishable F&B
ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT false;

-- Populate default department_id and warehouse_id for existing fashion products if null
DO $$
DECLARE
  default_dept_id UUID;
  default_wh_id UUID;
BEGIN
  SELECT id INTO default_dept_id FROM departments WHERE slug = 'apparel' LIMIT 1;
  SELECT id INTO default_wh_id FROM warehouses WHERE is_primary = true LIMIT 1;
  
  IF default_dept_id IS NOT NULL THEN
    UPDATE products SET department_id = default_dept_id WHERE department_id IS NULL;
  END IF;

  IF default_wh_id IS NOT NULL THEN
    UPDATE products SET warehouse_id = default_wh_id WHERE warehouse_id IS NULL;
  END IF;
END $$;

-- 4. CREATE PERFORMANCE INDEXES FOR ENTERPRISE SCALING
CREATE INDEX IF NOT EXISTS idx_products_department ON products(department_id);
CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_is_perishable ON products(is_perishable) WHERE is_perishable = true;
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses(is_active) WHERE is_active = true;

-- Verify migration status
SELECT 'Enterprise Concept Mall schema migration completed successfully!' as status;
