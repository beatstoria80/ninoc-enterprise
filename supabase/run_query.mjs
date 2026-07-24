import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: variants, error: err1 } = await supabase.from('product_variants').select('*').limit(1);
  if (!err1) {
    console.log('product_variants sample:', variants);
  } else {
    console.log('product_variants error:', err1.message);
  }

  const { data: variants2, error: err2 } = await supabase.from('variants').select('*').limit(1);
  if (!err2) {
    console.log('variants sample:', variants2);
  } else {
    console.log('variants error:', err2.message);
  }
}

main();
