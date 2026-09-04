const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:\\ninoc-enterprise\\.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
      .from('products')
      .select('*, variants(*), suppliers(name)')
      .order('created_at', { ascending: false })
      .limit(1);
  console.log('Anon with suppliers error:', error);
  console.log('Anon data count:', data ? data.length : 0);
}

test();
