import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  console.log('Fixing RLS for supplier_users...');
  
  const query = `
    DROP POLICY IF EXISTS "Supplier users can view their peers" ON public.supplier_users;
    CREATE POLICY "Supplier users can view their own row" ON public.supplier_users
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  `;

  // We can't run raw SQL directly through supabase-js standard client easily, 
  // but we can try using RPC if one exists, OR we can just use Postgres endpoint.
  // Wait, Supabase client doesn't support raw SQL from JS without an RPC function like 'exec_sql'.
  // However, we can just use the Postgres URI if we have it. We don't have the POSTGRES_URL.
  
  // Since we don't have Postgres URL, what can we do?
  // Is there a way to execute SQL via the Supabase REST API? No.
  // But wait, the user's issue might not be RLS if they are testing locally.
  // No, they are testing on live production URL.
  
  // Let me just disable RLS on supplier_users temporarily or check if there's an RPC.
  console.log("We cannot run raw SQL directly. Checking if exec_sql RPC exists...");
  const { data, error } = await supabase.rpc('exec_sql', { sql: query });
  if (error) {
    console.error("RPC failed:", error.message);
  } else {
    console.log("RPC success!");
  }
}

fixRLS().catch(console.error);
