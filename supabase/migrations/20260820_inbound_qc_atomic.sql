-- Atomic increment for variant stock & inventory movement insertion
CREATE OR REPLACE FUNCTION public.inbound_qc_receive(
    p_variant_id UUID,
    p_qty_good INT,
    p_po_id TEXT,
    p_po_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_default_warehouse_id UUID := '81f77276-ea57-470b-98c5-e8677c1e0093'; -- Gudang Utama NINOC
BEGIN
    IF p_qty_good > 0 THEN
        UPDATE public.variants
        SET stock_quantity = COALESCE(stock_quantity, 0) + p_qty_good,
            updated_at = NOW()
        WHERE id = p_variant_id;

        INSERT INTO public.inventory_movements (
            warehouse_id, variant_id, movement_type, quantity_change, reference_id, notes
        ) VALUES (
            v_default_warehouse_id, p_variant_id, 'inbound_do', p_qty_good, p_po_id,
            CONCAT('PO Item: ', p_po_item_id)
        );
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
