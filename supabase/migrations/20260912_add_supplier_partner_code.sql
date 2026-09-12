-- Migration: Add Partner Code to Suppliers
-- Description: Upgrades the B2B dashboard to use production-grade unique partner identifiers.

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS partner_code TEXT UNIQUE;

-- Backfill existing suppliers with a unique code using gen_random_uuid() pseudo-randomness
UPDATE public.suppliers 
SET partner_code = 'SUP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE partner_code IS NULL;

-- Now that all existing rows have a value, make the column NOT NULL
ALTER TABLE public.suppliers 
ALTER COLUMN partner_code SET NOT NULL;
