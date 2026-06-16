-- Configure RLS policies for customer_profiles table safely
do $$
begin
  -- 1. Ensure Row Level Security is enabled on customer_profiles
  alter table customer_profiles enable row level security;

  -- 2. Create policy: Admins have full access to customer_profiles (based on email in admin_roles)
  if not exists (
    select 1 from pg_policies 
    where tablename = 'customer_profiles' 
    and policyname = 'Admins have full access to customer_profiles'
  ) then
    create policy "Admins have full access to customer_profiles"
      on customer_profiles
      for all
      to authenticated
      using (
        exists (
          select 1 from admin_roles
          where admin_roles.email = auth.jwt() ->> 'email'
        )
      )
      with check (
        exists (
          select 1 from admin_roles
          where admin_roles.email = auth.jwt() ->> 'email'
        )
      );
  end if;

  -- 3. Create policy: Users can read their own profile
  if not exists (
    select 1 from pg_policies 
    where tablename = 'customer_profiles' 
    and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on customer_profiles
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  -- 4. Create policy: Users can insert their own profile
  if not exists (
    select 1 from pg_policies 
    where tablename = 'customer_profiles' 
    and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on customer_profiles
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  -- 5. Create policy: Users can update their own profile
  if not exists (
    select 1 from pg_policies 
    where tablename = 'customer_profiles' 
    and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on customer_profiles
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
