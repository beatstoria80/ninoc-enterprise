-- ============================================================================
-- Migration: Critical Bug Fixes (Voucher Race, Flash Sale Rollback, Order Number)
-- Date: 2026-09-11
-- Bugs Fixed:
--   #1 — Voucher Race Condition (atomic increment)
--   #3 — Flash Sale sold_count bisa negatif (clamped rollback)
--   #4 — order_number tidak tersimpan (parameter baru di create_order_transaction)
-- ============================================================================


-- ════════════════════════════════════════════════════════════════
-- FIX #1: Atomic Voucher Usage Increment (prevents double spending)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.increment_voucher_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.vouchers
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE code = p_code
    AND (max_usage IS NULL OR COALESCE(usage_count, 0) < max_usage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════════
-- FIX #3: Safe Flash Sale Stock Rollback (prevents negative sold_count)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rollback_flash_sale_stock(
  p_flash_sale_item_id UUID,
  p_qty INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.flash_sale_items
  SET sold_count = GREATEST(sold_count - p_qty, 0)
  WHERE id = p_flash_sale_item_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════════
-- FIX #4: Add order_number to create_order_transaction
-- Also preserves: shipment insertion, inventory_movements, flash_sale tracking
-- ════════════════════════════════════════════════════════════════
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
    p_items JSONB,
    p_shipments JSONB DEFAULT '[]'::JSONB,
    p_order_number TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_shipment JSONB;
    v_variant RECORD;
    v_new_stock INT;
    v_default_warehouse_id UUID := '81f77276-ea57-470b-98c5-e8677c1e0093'; -- Gudang Utama NINOC
BEGIN
    -- 1. Insert Order Header (NOW INCLUDES order_number)
    INSERT INTO public.orders (
        id, user_id, affiliate_id, customer_name, customer_email, 
        customer_phone, total_price, status, payment_status, 
        courier, shipping_address, order_number
    ) VALUES (
        p_order_id, p_user_id, p_affiliate_id, p_customer_name, p_customer_email,
        p_customer_phone, p_total_price, 'pending', 'pending',
        p_courier, p_shipping_address, p_order_number
    );

    -- 1.5 Insert Order Shipments (Multi-Warehouse)
    FOR v_shipment IN SELECT * FROM jsonb_array_elements(p_shipments)
    LOOP
        INSERT INTO public.order_shipments (
            order_id, warehouse_id, origin_postal_code, courier_name, courier_service, shipping_cost
        ) VALUES (
            p_order_id,
            NULLIF(v_shipment->>'warehouse_id', '')::UUID,
            v_shipment->>'origin_postal_code',
            v_shipment->>'courier_name',
            v_shipment->>'courier_service',
            (v_shipment->>'shipping_cost')::NUMERIC
        );
    END LOOP;

    -- 2. Iterate Order Items & Lock Inventory atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert Item
        INSERT INTO public.order_items (
            id, order_id, product_id, variant_id, product_name, 
            quantity, price_at_purchase, size, color, 
            supplier_id, supplier_hpp, ninoc_markup,
            flash_sale_item_id
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
            COALESCE((v_item->>'ninoc_markup')::NUMERIC, 0),
            NULLIF(v_item->>'flash_sale_item_id', '')::UUID
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

            INSERT INTO public.inventory_movements (
                warehouse_id, variant_id, movement_type, quantity_change, reference_id
            ) VALUES (
                v_default_warehouse_id, v_variant.id, 'outbound_order',
                -COALESCE((v_item->>'quantity')::INT, 1), p_order_id
            );
            
        -- Branch B: Fallback exact match by size and color
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

                INSERT INTO public.inventory_movements (
                    warehouse_id, variant_id, movement_type, quantity_change, reference_id
                ) VALUES (
                    v_default_warehouse_id, v_variant.id, 'outbound_order',
                    -COALESCE((v_item->>'quantity')::INT, 1), p_order_id
                );
            ELSE
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
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
