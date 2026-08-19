-- Migration: Fix Flash Sale Inventory Restock Leak (QA & Debugging)
-- Issue: When an order is cancelled/expires, Midtrans webhooks call restock_inventory().
-- But restock_inventory() was built before Flash Sales and did not restore flash_sale_items.sold_count.
-- This causes a permanent inventory blackhole for flash sale allocations.

-- 1. Add tracking column to order_items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS flash_sale_item_id UUID REFERENCES public.flash_sale_items(id) ON DELETE SET NULL;

-- 2. Update Transaction RPC to track the flash sale item
DROP FUNCTION IF EXISTS public.create_order_transaction(TEXT, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, JSONB, JSONB);

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
    p_shipments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_shipment JSONB;
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
        -- Insert Item with Flash Sale ID
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

        -- Decrement Physical Inventory Logic (Same as before)
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


-- 3. Upgrade Restock RPC to rollback Flash Sale Quota
CREATE OR REPLACE FUNCTION public.restock_inventory(p_order_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_variant RECORD;
BEGIN
    FOR v_item IN
        SELECT product_id, variant_id, size, quantity, flash_sale_item_id
        FROM public.order_items
        WHERE order_id = p_order_id
    LOOP
        -- [CRITICAL FIX]: Rollback Flash Sale Quota
        IF v_item.flash_sale_item_id IS NOT NULL THEN
            -- Decrease the sold_count to give the stock back to the public pool
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
        ELSE 
             -- Fallback: If no variant logic, just restock main product table (in case of single-variant product)
             UPDATE public.products
             SET stock_quantity = stock_quantity + v_item.quantity, updated_at = NOW()
             WHERE id = v_item.product_id;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
