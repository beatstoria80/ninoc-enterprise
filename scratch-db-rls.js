const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:\\ninoc-enterprise\\.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: 'SELECT * FROM pg_policies WHERE tablename = \'products\';' });
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
