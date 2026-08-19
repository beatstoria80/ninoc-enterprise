-- 20260819_flash_sales.sql
-- Create Flash Sales tables

CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flash_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flash_sale_id UUID NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.variants(id) ON DELETE CASCADE,
    flash_sale_price DECIMAL(15,2) NOT NULL,
    allocated_stock INTEGER NOT NULL DEFAULT 0,
    sold_count INTEGER NOT NULL DEFAULT 0,
    max_qty_per_user INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flash_sale_id, product_id, variant_id)
);

-- RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sale_items ENABLE ROW LEVEL SECURITY;

-- Public can read active flash sales
CREATE POLICY "Public read active flash sales" ON public.flash_sales
FOR SELECT USING (is_active = true AND end_time > NOW());

CREATE POLICY "Public read flash sale items" ON public.flash_sale_items
FOR SELECT USING (
    flash_sale_id IN (
        SELECT id FROM public.flash_sales WHERE is_active = true AND end_time > NOW()
    )
);

-- RPC for safely incrementing sold_count and returning success
CREATE OR REPLACE FUNCTION reserve_flash_sale_stock(
    p_flash_sale_item_id UUID,
    p_qty INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_allocated INTEGER;
    v_sold INTEGER;
BEGIN
    SELECT allocated_stock, sold_count INTO v_allocated, v_sold
    FROM public.flash_sale_items
    WHERE id = p_flash_sale_item_id
    FOR UPDATE;

    IF (v_allocated - v_sold) >= p_qty THEN
        UPDATE public.flash_sale_items
        SET sold_count = sold_count + p_qty
        WHERE id = p_flash_sale_item_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
