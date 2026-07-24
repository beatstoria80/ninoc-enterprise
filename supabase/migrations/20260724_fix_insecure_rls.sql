-- Security Fix: Replace insecure user_metadata checks with admin_roles check

DO $$
BEGIN

  -- 1. customer_profiles
  -- Drop insecure policy
  DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customer_profiles;
  -- Create secure policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_profiles' AND policyname = 'Admins have full access to customers secure'
  ) THEN
    CREATE POLICY "Admins have full access to customers secure"
      ON public.customer_profiles
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_roles
          WHERE admin_roles.email = auth.jwt() ->> 'email'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_roles
          WHERE admin_roles.email = auth.jwt() ->> 'email'
        )
      );
  END IF;

  -- 2. support_tickets (allow admin all)
  DROP POLICY IF EXISTS "allow admin all" ON public.support_tickets;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' AND policyname = 'Admins have full access to support_tickets'
  ) THEN
    CREATE POLICY "Admins have full access to support_tickets"
      ON public.support_tickets
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_roles
          WHERE admin_roles.email = auth.jwt() ->> 'email'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_roles
          WHERE admin_roles.email = auth.jwt() ->> 'email'
        )
      );
  END IF;

  -- 3. support_tickets (allow admin update)
  -- Since we just added "FOR ALL" above, we just need to drop the update one if it exists
  DROP POLICY IF EXISTS "allow admin update" ON public.support_tickets;

  -- 4. support_messages
  DROP POLICY IF EXISTS "allow admin all" ON public.support_messages;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_messages' AND policyname = 'Admins have full access to support_messages'
  ) THEN
    CREATE POLICY "Admins have full access to support_messages"
      ON public.support_messages
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_roles
          WHERE admin_roles.email = auth.jwt() ->> 'email'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_roles
          WHERE admin_roles.email = auth.jwt() ->> 'email'
        )
      );
  END IF;

END $$;
