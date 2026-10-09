-- Add display_order column to products for marketing-controlled catalog positioning
-- Lower numbers appear first. Default 999 ensures new products don't auto-pin to top.
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 999;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products (display_order ASC);
