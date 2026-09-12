import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraint() {
  const { data, error } = await supabase.rpc('query_constraints', {});
  console.log('Using generic SQL via RPC or just logging...');
}
checkConstraint();
