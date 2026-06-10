-- Migration: Inventory Concurrency Locks
-- Creates RPC functions to safely reserve and restock inventory using row-level locking

-- 1. Reserve Inventory (Checkout Phase)
-- This function reads all order_items for a given order, locks the corresponding variants,
-- checks if there's enough stock, and decrements it. If not enough stock, it rolls back and raises an exception.
CREATE OR REPLACE FUNCTION public.reserve_inventory(p_order_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_variant RECORD;
    v_new_stock INT;
BEGIN
    -- Loop through each item in the order
    FOR v_item IN
        SELECT product_id, variant_id, size, quantity
        FROM public.order_items
        WHERE order_id = p_order_id
    LOOP
        -- If variant_id exists, lock and update variant
        IF v_item.variant_id IS NOT NULL THEN
            SELECT stock_quantity INTO v_variant
            FROM public.variants
            WHERE id = v_item.variant_id
            FOR UPDATE; -- Acquire lock

            IF v_variant IS NULL THEN
                RAISE EXCEPTION 'Variant not found for product %', v_item.product_id;
            END IF;

            v_new_stock := v_variant.stock_quantity - v_item.quantity;

            IF v_new_stock < 0 THEN
                RAISE EXCEPTION 'Out of stock for variant %', v_item.variant_id;
            END IF;

            UPDATE public.variants
            SET stock_quantity = v_new_stock, updated_at = NOW()
            WHERE id = v_item.variant_id;
            
        -- Fallback: If no variant_id, try to match by size if variant_id wasn't provided directly
        -- This depends on how Ninoc stores data. If variants don't exist for some products, 
        -- we should ideally lock a general stock field on the products table.
        -- Assuming all stock is managed in 'variants' table based on previous codebase hints.
        -- If variants are required:
        ELSEIF v_item.size IS NOT NULL THEN
             SELECT id, stock_quantity INTO v_variant
             FROM public.variants
             WHERE product_id = v_item.product_id AND size = v_item.size
             FOR UPDATE;

             IF v_variant IS NOT NULL THEN
                 v_new_stock := v_variant.stock_quantity - v_item.quantity;
                 IF v_new_stock < 0 THEN
                     RAISE EXCEPTION 'Out of stock for product % size %', v_item.product_id, v_item.size;
                 END IF;

                 UPDATE public.variants
                 SET stock_quantity = v_new_stock, updated_at = NOW()
                 WHERE id = v_variant.id;
             END IF;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Restock Inventory (Cancel/Expire Phase)
-- This function restores stock when an order is cancelled or expires.
-- It locks the rows and increments the stock back safely.
CREATE OR REPLACE FUNCTION public.restock_inventory(p_order_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_variant RECORD;
BEGIN
    -- Only restock if the order is actually marked as cancelled or similar logic 
    -- (We assume the caller already verified the status, but it's good practice)
    
    FOR v_item IN
        SELECT product_id, variant_id, size, quantity
        FROM public.order_items
        WHERE order_id = p_order_id
    LOOP
        IF v_item.variant_id IS NOT NULL THEN
            SELECT id INTO v_variant
            FROM public.variants
            WHERE id = v_item.variant_id
            FOR UPDATE;

            IF v_variant IS NOT NULL THEN
                UPDATE public.variants
                SET stock_quantity = stock_quantity + v_item.quantity, updated_at = NOW()
                WHERE id = v_item.variant_id;
            END IF;
            
        ELSEIF v_item.size IS NOT NULL THEN
             SELECT id INTO v_variant
             FROM public.variants
             WHERE product_id = v_item.product_id AND size = v_item.size
             FOR UPDATE;

             IF v_variant IS NOT NULL THEN
                 UPDATE public.variants
                 SET stock_quantity = stock_quantity + v_item.quantity, updated_at = NOW()
                 WHERE id = v_variant.id;
             END IF;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
