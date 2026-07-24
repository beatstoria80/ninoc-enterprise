import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('Resetting all product and variant stock to 10...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, variants');
    
  if (error) {
    console.error('Failed to fetch products:', error);
    return;
  }
  
  let updatedCount = 0;
  
  for (const product of products) {
    const updates = { stock_quantity: 10 };
    
    if (Array.isArray(product.variants)) {
      updates.variants = product.variants.map(v => ({
        ...v,
        stock_quantity: 10
      }));
    }
    
    const { error: updateErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', product.id);
      
    if (updateErr) {
      console.error(`Failed to update product ${product.id}:`, updateErr);
    } else {
      updatedCount++;
    }
  }
  
  console.log(`✅ Successfully reset stock to 10 for ${updatedCount} products.`);
}

main().catch(console.error);
