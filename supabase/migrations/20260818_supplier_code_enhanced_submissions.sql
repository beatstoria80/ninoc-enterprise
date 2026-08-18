-- Migration: Add supplier_code & enhance submissions with variant data
-- Date: 2026-08-18

-- 1. Add supplier_code to suppliers table for unique identification
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS supplier_code TEXT UNIQUE;

-- 2. Enrich supplier_product_submissions with variant data & product metadata
ALTER TABLE public.supplier_product_submissions
ADD COLUMN IF NOT EXISTS variants_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT;

-- 3. Create index on supplier_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON public.suppliers(supplier_code);

-- 4. Backfill supplier codes for existing active suppliers
-- Pattern: NNC-FSH-{3-digit sequence} or NNC-FNB-{3-digit sequence}
-- Note: Since pillar is determined dynamically, we default to FSH for existing suppliers.
-- Admin can manually update via the SuppliersTab if needed.
DO $$
DECLARE
    sup RECORD;
    seq INTEGER := 0;
    new_code TEXT;
BEGIN
    FOR sup IN 
        SELECT id FROM public.suppliers 
        WHERE supplier_code IS NULL 
        ORDER BY created_at ASC
    LOOP
        seq := seq + 1;
        new_code := 'NNC-FSH-' || LPAD(seq::TEXT, 3, '0');
        UPDATE public.suppliers SET supplier_code = new_code WHERE id = sup.id;
    END LOOP;
END $$;
