const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:\\ninoc-enterprise\\.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
      .from('products')
      .select('*, variants(*), suppliers(name)')
      .order('created_at', { ascending: false })
      .limit(1);
  console.log('With suppliers error:', error);
  
  if (error) {
      const { data: fallback, error: err2 } = await supabase
        .from('products')
        .select('*, variants(*)')
        .order('created_at', { ascending: false })
        .limit(1);
      console.log('Fallback error:', err2);
      console.log('Fallback data count:', fallback ? fallback.length : 0);
  } else {
      console.log('Data count:', data ? data.length : 0);
  }
}

test();
