-- Phase 3: B2B Order & Ledger Logic (Order Items Ledger Split)

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_hpp DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ninoc_markup DECIMAL(12,2) DEFAULT 0;

-- Optional: We can add an index on supplier_id to make Ledger queries faster
CREATE INDEX IF NOT EXISTS idx_order_items_supplier_id ON public.order_items(supplier_id);

-- Supplier Ledgers
CREATE TABLE IF NOT EXISTS public.supplier_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    hpp_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'withdrawn', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supplier_ledgers_supplier_id ON public.supplier_ledgers(supplier_id);

-- Secure Ledger Policies (Preventing Unauthorized Access)
ALTER TABLE public.supplier_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access supplier ledgers" ON public.supplier_ledgers FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can view their own ledgers" ON public.supplier_ledgers FOR SELECT 
USING (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));

