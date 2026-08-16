-- ============================================================
-- NINOC Enterprise — RLS Security Patch (16 August 2026)
-- Fixes: "permission denied for table users" crash
-- Root Cause: RLS policies directly querying auth.users
-- Solution: Replace with auth.jwt()->'user_metadata'->>'role'
-- ============================================================

-- 1. Create a reusable SECURITY DEFINER helper function
--    This function safely checks admin status without exposing auth.users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Primary: Check JWT claim (fastest, no DB roundtrip)
  IF (auth.jwt()->'user_metadata'->>'role') = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: Check admin_roles table (public table, safe for authenticated role)
  IF EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE email = (auth.jwt()->>'email')
    AND role = 'super_admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. PATCH: affiliates table policies
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all affiliates" ON public.affiliates;
CREATE POLICY "Admin can view all affiliates"
ON public.affiliates FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert affiliates" ON public.affiliates;
CREATE POLICY "Admin can insert affiliates"
ON public.affiliates FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update affiliates" ON public.affiliates;
CREATE POLICY "Admin can update affiliates"
ON public.affiliates FOR UPDATE
USING (public.is_admin());

-- ============================================================
-- 3. PATCH: affiliate_links table policies
-- ============================================================
DROP POLICY IF EXISTS "Admin can manage all affiliate links" ON public.affiliate_links;
CREATE POLICY "Admin can manage all affiliate links"
ON public.affiliate_links FOR ALL
USING (public.is_admin());

-- ============================================================
-- 4. PATCH: affiliate_commissions table policies
-- ============================================================
DROP POLICY IF EXISTS "Admin can manage all commissions" ON public.affiliate_commissions;
CREATE POLICY "Admin can manage all commissions"
ON public.affiliate_commissions FOR ALL
USING (public.is_admin());

-- ============================================================
-- 5. PATCH: retur_requests table policies
-- ============================================================
DROP POLICY IF EXISTS "retur_admin_all" ON retur_requests;
CREATE POLICY "retur_admin_all" ON retur_requests
FOR ALL USING (public.is_admin());

-- ============================================================
-- 6. PATCH: customer_activity_log table policies
-- ============================================================
DROP POLICY IF EXISTS "activity_log_admin_all" ON customer_activity_log;
CREATE POLICY "activity_log_admin_all" ON customer_activity_log
FOR ALL USING (public.is_admin());

-- ============================================================
-- 7. PATCH: support_tickets table policies
-- ============================================================
DROP POLICY IF EXISTS "support_tickets_admin_update_fields" ON support_tickets;
CREATE POLICY "support_tickets_admin_update_fields" ON support_tickets
FOR UPDATE USING (
  public.is_admin()
  OR auth.uid() = user_id
);

-- ============================================================
-- 8. Verify
-- ============================================================
SELECT 'RLS Security Patch applied successfully' AS status;
