-- Phase 5: Warehouse Management System (WMS)

-- 1. Purchase Orders (PO)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_received', 'completed', 'cancelled')),
    total_amount DECIMAL(12,2) DEFAULT 0,
    expected_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID NOT NULL REFERENCES public.variants(id),
    qty_ordered INTEGER NOT NULL,
    qty_received INTEGER DEFAULT 0,
    unit_hpp DECIMAL(12,2) NOT NULL
);

-- 2. Delivery Orders (DO Inbound)
CREATE TABLE IF NOT EXISTS public.delivery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    do_number TEXT UNIQUE NOT NULL,
    po_id UUID REFERENCES public.purchase_orders(id),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'qc_rejected')),
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.delivery_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    do_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID NOT NULL REFERENCES public.variants(id),
    qty_shipped INTEGER NOT NULL,
    qty_accepted INTEGER DEFAULT 0,
    qty_rejected INTEGER DEFAULT 0,
    notes TEXT
);

-- 3. Inventory Movements (Kartu Stok)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    variant_id UUID NOT NULL REFERENCES public.variants(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound_do', 'outbound_order', 'return', 'adjustment_loss', 'adjustment_found')),
    quantity_change INTEGER NOT NULL,
    reference_id TEXT, -- DO number or Order ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Secure Admin Policies (Preventing Unauthorized Access)
CREATE POLICY "Admins full access PO" ON public.purchase_orders FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access PO items" ON public.purchase_order_items FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access DO" ON public.delivery_orders FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access DO items" ON public.delivery_order_items FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access Inv movements" ON public.inventory_movements FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
