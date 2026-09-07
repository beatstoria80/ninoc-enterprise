-- Add discount period columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_start_date timestamptz DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_end_date timestamptz DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.discount_start_date IS 'Start date/time of the discount period. If NULL, discount is always active (no time restriction).';
COMMENT ON COLUMN products.discount_end_date IS 'End date/time of the discount period. If NULL, discount has no expiry.';
