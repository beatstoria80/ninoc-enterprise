require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findAdmin() {
  const { data, error } = await supabase.from('customer_profiles').select('*');
  if (error) {
    console.error(error);
    return;
  }
  const admins = data.filter(u => u.role === 'admin' || u.full_name?.toLowerCase().includes('admin'));
  console.log("Found admins profiles:", admins);
}

findAdmin();
