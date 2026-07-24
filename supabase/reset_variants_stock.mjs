import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('Resetting all variant stock to 10...');
  
  // We can just update all rows in variants
  const { data, error, count } = await supabase
    .from('variants')
    .update({ stock_quantity: 10 })
    .gte('created_at', '1900-01-01T00:00:00Z') // Just to match all rows
    .select('id');
    
  if (error) {
    console.error('Failed to update variants:', error);
  } else {
    console.log(`✅ Successfully reset stock to 10 for ${data?.length} variant SKUs.`);
  }
}

main();
