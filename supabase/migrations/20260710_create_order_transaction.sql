-- Migration: Atomic Checkout Transaction
-- Replaces non-atomic multiple client requests with a single atomic PostgreSQL transaction
-- ensuring Orders, Items, and Inventory Locks succeed or fail together.

CREATE OR REPLACE FUNCTION public.create_order_transaction(
    p_order_id TEXT,
    p_user_id UUID,
    p_affiliate_id UUID,
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_total_price NUMERIC,
    p_courier TEXT,
    p_shipping_address JSONB,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_variant RECORD;
    v_new_stock INT;
BEGIN
    -- 1. Insert Order Header
    INSERT INTO public.orders (
        id, user_id, affiliate_id, customer_name, customer_email, 
        customer_phone, total_price, status, payment_status, 
        courier, shipping_address
    ) VALUES (
        p_order_id, p_user_id, p_affiliate_id, p_customer_name, p_customer_email,
        p_customer_phone, p_total_price, 'pending', 'pending',
        p_courier, p_shipping_address
    );

    -- 2. Insert Order Items & Lock Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert Item
        INSERT INTO public.order_items (
            id, order_id, product_id, variant_id, product_name, 
            quantity, price_at_purchase, size, color, 
            supplier_id, supplier_hpp, ninoc_markup
        ) VALUES (
            (v_item->>'id')::UUID,
            p_order_id,
            (v_item->>'product_id')::TEXT,
            NULLIF(v_item->>'variant_id', '')::UUID,
            v_item->>'product_name',
            (v_item->>'quantity')::INT,
            (v_item->>'price_at_purchase')::NUMERIC,
            NULLIF(v_item->>'size', ''),
            NULLIF(v_item->>'color', ''),
            NULLIF(v_item->>'supplier_id', '')::UUID,
            (v_item->>'supplier_hpp')::NUMERIC,
            (v_item->>'ninoc_markup')::NUMERIC
        );

        -- Lock Inventory
        IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != '' THEN
            SELECT stock_quantity INTO v_variant
            FROM public.variants
            WHERE id = (v_item->>'variant_id')::UUID
            FOR UPDATE;

            IF v_variant IS NULL THEN
                RAISE EXCEPTION 'Variant not found for product %', v_item->>'product_id';
            END IF;

            v_new_stock := v_variant.stock_quantity - (v_item->>'quantity')::INT;

            IF v_new_stock < 0 THEN
                RAISE EXCEPTION 'Out of stock for variant %', v_item->>'variant_id';
            END IF;

            UPDATE public.variants
            SET stock_quantity = v_new_stock, updated_at = NOW()
            WHERE id = (v_item->>'variant_id')::UUID;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    -- Postgres automatically rolls back the entire transaction here
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
