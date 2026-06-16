-- Enable real-time replication for customer_profiles, support_messages, and support_tickets safely
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'customer_profiles'
  ) then
    alter publication supabase_realtime add table customer_profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'support_messages'
  ) then
    alter publication supabase_realtime add table support_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'support_tickets'
  ) then
    alter publication supabase_realtime add table support_tickets;
  end if;
end $$;
