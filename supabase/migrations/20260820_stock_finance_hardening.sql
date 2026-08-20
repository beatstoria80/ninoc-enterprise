-- ============================================================================
-- Migration: Stock & Finance Hardening (Deep Root Audit)
-- Date: 2026-08-20
-- Purpose: Fix 7 critical architecture issues for industry-standard 
--          accountability in stock movements and supplier finance.
-- ============================================================================

-- ============================================================================
-- FIX #1: Upgrade create_order_transaction to record inventory_movements
-- ============================================================================
-- We need to add a warehouse_id parameter and INSERT into inventory_movements
-- for every stock deduction during checkout.

-- First, we need to handle the p_shipments parameter that may have been added separately.
-- We'll create a new version of the function that includes inventory_movements logging.

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
    p_shipments JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_variant RECORD;
    v_new_stock INT;
    v_default_warehouse_id UUID := '81f77276-ea57-470b-98c5-e8677c1e0093'; -- Gudang Utama NINOC
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

            -- [HARDENING] Record inventory movement for audit trail
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

                -- [HARDENING] Record inventory movement
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
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- FIX #2: Upgrade restock_inventory to record inventory_movements
-- ============================================================================
CREATE OR REPLACE FUNCTION public.restock_inventory(p_order_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_variant RECORD;
    v_default_warehouse_id UUID := '81f77276-ea57-470b-98c5-e8677c1e0093'; -- Gudang Utama NINOC
BEGIN
    FOR v_item IN
        SELECT product_id, variant_id, size, quantity, flash_sale_item_id
        FROM public.order_items
        WHERE order_id = p_order_id
    LOOP
        -- [CRITICAL FIX]: Rollback Flash Sale Quota
        IF v_item.flash_sale_item_id IS NOT NULL THEN
            UPDATE public.flash_sale_items
            SET sold_count = sold_count - v_item.quantity
            WHERE id = v_item.flash_sale_item_id AND sold_count >= v_item.quantity;
        END IF;

        -- [ORIGINAL]: Rollback Physical Inventory
        IF v_item.variant_id IS NOT NULL THEN
            SELECT id INTO v_variant
            FROM public.variants
            WHERE id = v_item.variant_id
            FOR UPDATE;

            IF v_variant IS NOT NULL THEN
                UPDATE public.variants
                SET stock_quantity = stock_quantity + v_item.quantity, updated_at = NOW()
                WHERE id = v_item.variant_id;

                -- [HARDENING] Record reversal in inventory_movements
                INSERT INTO public.inventory_movements (
                    warehouse_id, variant_id, movement_type, quantity_change, reference_id
                ) VALUES (
                    v_default_warehouse_id, v_item.variant_id, 'outbound_order',
                    v_item.quantity, CONCAT('CANCEL-', p_order_id)
                );
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

                 -- [HARDENING] Record reversal in inventory_movements
                 INSERT INTO public.inventory_movements (
                     warehouse_id, variant_id, movement_type, quantity_change, reference_id
                 ) VALUES (
                     v_default_warehouse_id, v_variant.id, 'outbound_order',
                     v_item.quantity, CONCAT('CANCEL-', p_order_id)
                 );
             END IF;
        ELSE 
             UPDATE public.products
             SET stock_quantity = stock_quantity + v_item.quantity, updated_at = NOW()
             WHERE id = v_item.product_id;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- FIX #5: Upgrade supplier_balances View — separate pending vs cleared
-- ============================================================================
DROP VIEW IF EXISTS public.supplier_balances;

CREATE VIEW public.supplier_balances AS
SELECT 
    s.id as supplier_id,
    -- Available Balance: ONLY cleared revenue minus cleared deductions
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'SALES_REVENUE' AND sl.status = 'cleared' THEN sl.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'CAMPAIGN_FEE' AND sl.status = 'cleared' THEN sl.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'WITHDRAWAL' AND sl.status = 'cleared' THEN sl.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'STORAGE_FEE' AND sl.status = 'cleared' THEN sl.amount ELSE 0 END), 0) AS available_balance,
    -- Pending Balance: Revenue that is not yet cleared (awaiting delivery confirmation)
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'SALES_REVENUE' AND sl.status = 'pending' THEN sl.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'CAMPAIGN_FEE' AND sl.status = 'pending' THEN sl.amount ELSE 0 END), 0) AS pending_balance,
    -- Total Withdrawn
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'WITHDRAWAL' AND sl.status = 'cleared' THEN sl.amount ELSE 0 END), 0) AS total_withdrawn
FROM public.suppliers s
LEFT JOIN public.supplier_ledgers sl ON s.id = sl.supplier_id
GROUP BY s.id;

GRANT SELECT ON public.supplier_balances TO authenticated;


-- ============================================================================
-- FIX #6: Harden finance_ledgers RLS — restrict to admin only
-- Only applies if the table exists in this environment
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_ledgers') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated admins full access to finance_ledgers" ON public.finance_ledgers';
        EXECUTE 'CREATE POLICY "Admins full access finance_ledgers" ON public.finance_ledgers FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))';
    END IF;
END $$;

-- Service role (used by API routes) bypasses RLS, so system inserts still work.
