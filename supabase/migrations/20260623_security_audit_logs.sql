-- 1. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    table_affected TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT
);

-- RLS: Only Super Admin can read. NO ONE can update/delete.
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit logs" 
    ON public.admin_audit_logs 
    FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT id FROM admin_roles WHERE role = 'super_admin'
        )
    );

CREATE POLICY "Service role can insert audit logs" 
    ON public.admin_audit_logs 
    FOR INSERT 
    WITH CHECK (true);

-- 2. Make supplier_ledgers and inventory_movements IMMUTABLE
-- Block UPDATE and DELETE to prevent financial and inventory fraud.
-- Corrections must be made via reversal entries.

CREATE OR REPLACE FUNCTION block_update_delete()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'This table is immutable. Modifications are locked for fraud prevention. Create a reversal entry instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_supplier_ledgers_update ON public.supplier_ledgers;
CREATE TRIGGER trg_block_supplier_ledgers_update
    BEFORE UPDATE OR DELETE ON public.supplier_ledgers
    FOR EACH ROW
    EXECUTE FUNCTION block_update_delete();


