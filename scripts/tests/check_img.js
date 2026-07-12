require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkProduct() {
  const { data, error } = await supabase.from('products').select('slug, image_url').eq('slug', 'be-down-in-spirit').single();
  console.log(data);
}

checkProduct();
