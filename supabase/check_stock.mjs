import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: variants, error } = await supabase.from('variants').select('id, size, color, stock_quantity');
  if (error) {
    console.error('Error:', error);
  } else {
    const notTen = variants.filter(v => v.stock_quantity !== 10);
    console.log(`Total variants: ${variants.length}`);
    console.log(`Variants not equal to 10: ${notTen.length}`);
    if (notTen.length > 0) {
      console.log('Sample of variants not equal to 10:', notTen.slice(0, 5));
    } else {
      console.log('All variants have stock_quantity = 10!');
    }
  }
}

main();
