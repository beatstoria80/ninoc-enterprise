-- Add variant_label column to products table
-- This allows admins to customize the variant selection label per product
-- e.g. "Tech Deck Series" instead of the default "Pilih Warna"
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_label VARCHAR(100);
