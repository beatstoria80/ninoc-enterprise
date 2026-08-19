-- Migration: B2B Supplier Dynamic Finance & Campaign Agreements
-- Expands supplier_ledgers to support double-entry accounting for virtual inventory models.

-- 1. Create Supplier Campaign Agreements Table
CREATE TABLE IF NOT EXISTS public.supplier_campaign_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    cogs_deduction_amount DECIMAL(12,2) DEFAULT 0,
    cogs_deduction_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supplier_campaign_agreements_supplier_id ON public.supplier_campaign_agreements(supplier_id);
ALTER TABLE public.supplier_campaign_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access campaign agreements" ON public.supplier_campaign_agreements FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can view their own campaign agreements" ON public.supplier_campaign_agreements FOR SELECT 
USING (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));


-- 2. Modify Supplier Ledgers to support dynamic entries
-- Note: Security triggers block updates to supplier_ledgers (from 20260623_security_audit_logs.sql)
-- We temporarily disable the trigger to allow schema migration of existing rows.
DROP TRIGGER IF EXISTS trg_block_supplier_ledgers_update ON public.supplier_ledgers;

ALTER TABLE public.supplier_ledgers
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'SALES_REVENUE' CHECK (transaction_type IN ('SALES_REVENUE', 'CAMPAIGN_FEE', 'STORAGE_FEE', 'WITHDRAWAL')),
ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS description TEXT,
ALTER COLUMN order_id DROP NOT NULL,
ALTER COLUMN order_item_id DROP NOT NULL,
ALTER COLUMN hpp_amount DROP NOT NULL;

-- Backfill amount from hpp_amount for existing rows
UPDATE public.supplier_ledgers 
SET amount = hpp_amount, 
    description = 'Revenue from Order',
    transaction_type = 'SALES_REVENUE'
WHERE amount IS NULL;

-- Re-enable the immutable security trigger
CREATE TRIGGER trg_block_supplier_ledgers_update
    BEFORE UPDATE OR DELETE ON public.supplier_ledgers
    FOR EACH ROW
    EXECUTE FUNCTION public.block_update_delete();


-- 3. Create Supplier Balances View
-- This view acts as a real-time snapshot of a supplier's balance without needing complex tables.
CREATE OR REPLACE VIEW public.supplier_balances AS
SELECT 
    s.id as supplier_id,
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'SALES_REVENUE' AND sl.status IN ('cleared', 'pending') THEN sl.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'CAMPAIGN_FEE' AND sl.status IN ('cleared', 'pending') THEN sl.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'WITHDRAWAL' AND sl.status IN ('cleared', 'pending') THEN sl.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'STORAGE_FEE' AND sl.status IN ('cleared', 'pending') THEN sl.amount ELSE 0 END), 0) AS available_balance,
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'WITHDRAWAL' AND sl.status = 'cleared' THEN sl.amount ELSE 0 END), 0) AS total_withdrawn
FROM public.suppliers s
LEFT JOIN public.supplier_ledgers sl ON s.id = sl.supplier_id
GROUP BY s.id;

-- Ensure permissions for the view
GRANT SELECT ON public.supplier_balances TO authenticated;
