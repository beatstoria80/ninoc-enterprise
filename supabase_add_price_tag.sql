-- ============================================================
-- NINOC ARCHIVE — DATABASE MIGRATION: ADD PRICE TAG SUPPORT
-- ============================================================

-- Add price_tag column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_tag TEXT DEFAULT NULL;

COMMENT ON COLUMN products.price_tag IS 'Custom label/badge to display above the price (e.g. Harga Special, Diskon, Price Deal)';
