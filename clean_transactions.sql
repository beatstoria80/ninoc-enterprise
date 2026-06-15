-- WARNING: THIS SCRIPT DELETES ALL TRANSACTION DATA
-- Use this ONLY in Development/Staging to clear out old test data.

-- We use CASCADE to automatically clear dependent tables like:
-- order_items, tracking_logs, supplier_ledgers, voucher_usages, and affiliate_commissions.

TRUNCATE TABLE public.orders CASCADE;


-- If you also want to clear out pending cart sessions, uncomment below:
-- TRUNCATE TABLE public.carts CASCADE;

-- Reset sequence for admin_audit_logs if it uses a serial ID (optional, using UUID so this is safe)
