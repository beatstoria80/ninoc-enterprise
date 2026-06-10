-- Phase 1: Supplier Consignment Foundation

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Supplier Users (Auth mapping)
CREATE TABLE IF NOT EXISTS public.supplier_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(supplier_id, user_id)
);

-- 3. Warehouses / Fulfillment Centers
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE, -- if NULL, it's a NINOC owned warehouse
    name TEXT NOT NULL,
    address_line TEXT,
    city TEXT,
    postal_code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_crossdock_hub BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Alter products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS consignment_model TEXT CHECK (consignment_model IN ('dropship', 'ninoc_warehouse'));

-- 5. Alter product_costings to support Supplier Ledgers
ALTER TABLE public.product_costings
ADD COLUMN IF NOT EXISTS supplier_base_price DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ninoc_markup DECIMAL(12,2) DEFAULT 0;

-- Trigger for updated_at on suppliers
CREATE TRIGGER handle_updated_at_suppliers
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Supplier users can read their own supplier data
CREATE POLICY "Suppliers can view their own data" ON public.suppliers
    FOR SELECT
    TO authenticated
    USING (id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));

CREATE POLICY "Supplier users can view their peers" ON public.supplier_users
    FOR SELECT
    TO authenticated
    USING (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));

CREATE POLICY "Warehouses viewable by their supplier or ninoc staff" ON public.warehouses
    FOR SELECT
    TO authenticated
    USING (
        supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid())
        OR 
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) -- assuming admin_users exists, otherwise fallback to app logic
    );
