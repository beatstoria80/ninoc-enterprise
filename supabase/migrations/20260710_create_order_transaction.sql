-- Migration: Atomic Checkout Transaction (Hardened Production Build)
-- Replaces vulnerable multi-row queries with precise, case-insensitive LIMIT 1 FOR UPDATE locks
-- and human-readable exception formatting.

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

    -- 2. Iterate Order Items & Lock Inventory atomically
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
            (v_item->>'product_id')::UUID,
            NULLIF(v_item->>'variant_id', '')::UUID,
            v_item->>'product_name',
            COALESCE((v_item->>'quantity')::INT, 1),
            COALESCE((v_item->>'price_at_purchase')::NUMERIC, 0),
            NULLIF(v_item->>'size', ''),
            NULLIF(v_item->>'color', ''),
            NULLIF(v_item->>'supplier_id', '')::UUID,
            COALESCE((v_item->>'supplier_hpp')::NUMERIC, 0),
            COALESCE((v_item->>'ninoc_markup')::NUMERIC, 0)
        );

        -- Branch A: Exact Variant ID provided
        IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != '' AND v_item->>'variant_id' != 'null' THEN
            SELECT id, stock_quantity INTO v_variant
            FROM public.variants
            WHERE id = (v_item->>'variant_id')::UUID
            FOR UPDATE;

            IF v_variant IS NULL THEN
                RAISE EXCEPTION 'Varian produk "%" tidak ditemukan di database.', v_item->>'product_name';
            END IF;

            v_new_stock := COALESCE(v_variant.stock_quantity, 0) - COALESCE((v_item->>'quantity')::INT, 1);

            IF v_new_stock < 0 THEN
                RAISE EXCEPTION 'Stok "%" % tidak mencukupi (sisa stok: % unit).', 
                    v_item->>'product_name', 
                    COALESCE(CONCAT('(', v_item->>'size', ')'), ''), 
                    COALESCE(v_variant.stock_quantity, 0);
            END IF;

            UPDATE public.variants
            SET stock_quantity = v_new_stock, updated_at = NOW()
            WHERE id = v_variant.id;
            
        -- Branch B: Fallback exact match by size and color (with LIMIT 1 protection against TOO_MANY_ROWS)
        ELSIF v_item->>'size' IS NOT NULL AND v_item->>'size' != '' AND v_item->>'size' != 'null' THEN
            SELECT id, stock_quantity INTO v_variant
            FROM public.variants
            WHERE product_id = (v_item->>'product_id')::UUID 
              AND UPPER(TRIM(size)) = UPPER(TRIM(v_item->>'size'))
              AND (
                  v_item->>'color' IS NULL OR v_item->>'color' = '' OR v_item->>'color' = 'null' OR
                  UPPER(TRIM(color)) = UPPER(TRIM(v_item->>'color'))
              )
            LIMIT 1
            FOR UPDATE;

            IF v_variant IS NOT NULL THEN
                v_new_stock := COALESCE(v_variant.stock_quantity, 0) - COALESCE((v_item->>'quantity')::INT, 1);
                IF v_new_stock < 0 THEN
                    RAISE EXCEPTION 'Stok "%" (%) tidak mencukupi (sisa stok: % unit).', 
                        v_item->>'product_name', 
                        v_item->>'size', 
                        COALESCE(v_variant.stock_quantity, 0);
                END IF;

                UPDATE public.variants
                SET stock_quantity = v_new_stock, updated_at = NOW()
                WHERE id = v_variant.id;
            ELSE
                -- If size variant not tracked in variants table, deduct from main products table
                UPDATE public.products
                SET stock_quantity = COALESCE(stock_quantity, 0) - COALESCE((v_item->>'quantity')::INT, 1),
                    updated_at = NOW()
                WHERE id = (v_item->>'product_id')::UUID
                  AND COALESCE(stock_quantity, 0) >= COALESCE((v_item->>'quantity')::INT, 1);
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Stok "%" tidak mencukupi atau habis.', v_item->>'product_name';
                END IF;
            END IF;
        ELSE
            -- Branch C: No variant, no size — deduct directly from product-level stock
            UPDATE public.products
            SET stock_quantity = COALESCE(stock_quantity, 0) - COALESCE((v_item->>'quantity')::INT, 1),
                updated_at = NOW()
            WHERE id = (v_item->>'product_id')::UUID
              AND COALESCE(stock_quantity, 0) >= COALESCE((v_item->>'quantity')::INT, 1);
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Stok produk "%" tidak mencukupi atau telah habis.', v_item->>'product_name';
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    -- Automatically rolls back all header and item insertions, plus stock deductions
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
