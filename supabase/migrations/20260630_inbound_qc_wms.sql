-- Migration: Add QC features to Inbound WMS

-- 1. Add qty_rejected to po_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='po_items' AND column_name='qty_rejected') THEN
        ALTER TABLE public.po_items ADD COLUMN qty_rejected INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Create inbound_qc_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.inbound_qc_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    po_item_id UUID NOT NULL REFERENCES public.po_items(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    qty_good INTEGER NOT NULL DEFAULT 0,
    qty_rejected INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.inbound_qc_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access inbound_qc_logs" ON public.inbound_qc_logs FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
