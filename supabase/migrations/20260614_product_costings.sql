-- Migration: Create product_costings table for complex ROAS calculations
-- Links 1-to-1 with products table to store HPP, Packaging Cost, Operational Pct, and Targets.

CREATE TABLE IF NOT EXISTS public.product_costings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Costs
    supplier_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL,    -- Base HPP (Harga Pokok Penjualan)
    packaging_cost DECIMAL(12, 2) DEFAULT 0 NOT NULL,   -- Polymailer, bubble wrap, box, etc.
    operational_pct DECIMAL(5, 2) DEFAULT 0 NOT NULL,   -- e.g., 5.00 for 5% of selling price to cover general overhead
    
    -- Targets
    target_margin_pct DECIMAL(5, 2) DEFAULT 40.00 NOT NULL, -- Target Gross Margin % (e.g. 40%)
    target_roas DECIMAL(6, 2) DEFAULT 300.00 NOT NULL,      -- Target ROAS in % (e.g. 300% = 3x Return)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by product
CREATE INDEX IF NOT EXISTS idx_product_costings_product_id ON public.product_costings(product_id);

-- Enable RLS
ALTER TABLE public.product_costings ENABLE ROW LEVEL SECURITY;

-- Policies for product_costings
-- Admins (Service Role) have full access. Storefront doesn't need to read HPP (sensitive data).
-- Authenticated admins can manage it.
CREATE POLICY "Allow authenticated admins full access to product_costings"
ON public.product_costings FOR ALL
USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Function to automatically create an empty costing row when a new product is inserted
CREATE OR REPLACE FUNCTION public.handle_new_product_costing()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.product_costings (product_id)
    VALUES (NEW.id)
    ON CONFLICT (product_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create costing for new products
DROP TRIGGER IF EXISTS on_product_created_costing ON public.products;
CREATE TRIGGER on_product_created_costing
    AFTER INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_product_costing();

-- Backfill missing costings for existing products
INSERT INTO public.product_costings (product_id)
SELECT id FROM public.products
ON CONFLICT (product_id) DO NOTHING;
