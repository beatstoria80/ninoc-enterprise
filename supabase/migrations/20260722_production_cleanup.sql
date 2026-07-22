-- ============================================================
-- NINOC Enterprise: Production Database Cleanup
-- Date: 2026-07-22
-- Purpose: Clean all test/sandbox transaction data and reset
--          product stock to clean state (no negative values)
-- ============================================================
-- ⚠️ WARNING: This migration PERMANENTLY DELETES all order and
--    transaction data. Only run this when transitioning from
--    sandbox/testing to production with a clean slate.
-- ============================================================

-- 1. Clear all tracking/shipping logs
DELETE FROM tracking_logs;

-- 2. Clear WhatsApp send logs
DELETE FROM wa_send_log;

-- 3. Clear finance ledgers
DELETE FROM finance_ledgers;

-- 4. Clear supplier ledgers
DELETE FROM supplier_ledgers;

-- 5. Clear affiliate commissions
DELETE FROM affiliate_commissions;

-- 6. Clear order items (must be before orders due to FK)
DELETE FROM order_items;

-- 7. Clear inventory locks
DELETE FROM inventory_locks;

-- 8. Clear user notifications related to orders
DELETE FROM user_notifications WHERE action_link LIKE '/profile/orders/%';

-- 9. Clear orders (main table)
DELETE FROM orders;

-- 10. Reset negative stock on products to 0
UPDATE products 
SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0), 0)
WHERE stock_quantity IS NULL OR stock_quantity < 0;

-- 11. Reset negative stock on product variants (JSONB array)
-- This updates the variants JSONB array to set any negative stock_quantity to 0
UPDATE products
SET variants = (
  SELECT jsonb_agg(
    CASE 
      WHEN (elem->>'stock_quantity')::int < 0 
      THEN jsonb_set(elem, '{stock_quantity}', '0')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(variants) AS elem
)
WHERE variants IS NOT NULL 
  AND variants != 'null'::jsonb
  AND jsonb_typeof(variants) = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(variants) AS v
    WHERE (v->>'stock_quantity')::int < 0
  );

-- 12. Clear order transaction logs if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_transactions') THEN
    EXECUTE 'DELETE FROM order_transactions';
  END IF;
END $$;

-- 13. Clear retur/return requests if any test data exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'retur_requests') THEN
    EXECUTE 'DELETE FROM retur_requests';
  END IF;
END $$;

-- Verification query (run after migration to confirm)
-- SELECT 'products' AS table_name, COUNT(*) AS remaining FROM products
-- UNION ALL SELECT 'orders', COUNT(*) FROM orders
-- UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
-- UNION ALL SELECT 'tracking_logs', COUNT(*) FROM tracking_logs;
