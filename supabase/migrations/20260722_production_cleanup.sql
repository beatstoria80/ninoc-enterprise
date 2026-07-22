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

-- 10. Reset stock on all variants to 10
-- Restores stock deducted from fake sandbox transactions
UPDATE variants 
SET stock_quantity = 10;

-- 11. Clear order transaction logs if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_transactions') THEN
    EXECUTE 'DELETE FROM order_transactions';
  END IF;
END $$;

-- 12. Clear retur/return requests if any test data exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'retur_requests') THEN
    EXECUTE 'DELETE FROM retur_requests';
  END IF;
END $$;

-- Verification query (run after migration to confirm)
-- SELECT 'variants' AS table_name, COUNT(*) AS remaining FROM variants WHERE stock_quantity != 10
-- UNION ALL SELECT 'orders', COUNT(*) FROM orders
-- UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
-- UNION ALL SELECT 'tracking_logs', COUNT(*) FROM tracking_logs;
