-- Add missing columns to product_costings for the expanded costing modal
-- These columns are used by the admin Product Costing Configuration form

ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 11 NOT NULL;
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS courier_regency_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS courier_inter_regency_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS courier_same_day_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS courier_instant_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS selling_price DECIMAL(12, 2) DEFAULT 0 NOT NULL;
