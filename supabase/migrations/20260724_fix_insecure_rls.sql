-- Security Fix: Replace insecure user_metadata checks with admin_roles check

-- 1. Tabel customer_profiles
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customer_profiles;
DROP POLICY IF EXISTS "Admins have full access to customers secure" ON public.customer_profiles;

CREATE POLICY "Admins have full access to customers secure" ON public.customer_profiles
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.email = auth.jwt() ->> 'email'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.email = auth.jwt() ->> 'email'));

-- 2. Tabel support_tickets
DROP POLICY IF EXISTS "allow admin all" ON public.support_tickets;
DROP POLICY IF EXISTS "allow admin update" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins have full access to support_tickets" ON public.support_tickets;

CREATE POLICY "Admins have full access to support_tickets" ON public.support_tickets
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.email = auth.jwt() ->> 'email'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.email = auth.jwt() ->> 'email'));

-- 3. Tabel support_messages
DROP POLICY IF EXISTS "allow admin all" ON public.support_messages;
DROP POLICY IF EXISTS "Admins have full access to support_messages" ON public.support_messages;

CREATE POLICY "Admins have full access to support_messages" ON public.support_messages
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.email = auth.jwt() ->> 'email'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.email = auth.jwt() ->> 'email'));
