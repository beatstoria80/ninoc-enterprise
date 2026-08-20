-- Migration: Create supplier_withdrawals table and RLS policies
CREATE TABLE IF NOT EXISTS public.supplier_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_withdrawals_supplier_id ON public.supplier_withdrawals(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_withdrawals_status ON public.supplier_withdrawals(status);

-- Enable RLS
ALTER TABLE public.supplier_withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins full access supplier withdrawals" ON public.supplier_withdrawals;
DROP POLICY IF EXISTS "Suppliers can view their own withdrawals" ON public.supplier_withdrawals;
DROP POLICY IF EXISTS "Suppliers can insert their own withdrawals" ON public.supplier_withdrawals;

-- Admin access: Admins can do everything
CREATE POLICY "Admins full access supplier withdrawals" 
ON public.supplier_withdrawals FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Supplier read access: Suppliers can view their own withdrawal requests
CREATE POLICY "Suppliers can view their own withdrawals" 
ON public.supplier_withdrawals FOR SELECT 
USING (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));

-- Supplier insert access: Suppliers can submit their own withdrawal requests
CREATE POLICY "Suppliers can insert their own withdrawals" 
ON public.supplier_withdrawals FOR INSERT 
WITH CHECK (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));
