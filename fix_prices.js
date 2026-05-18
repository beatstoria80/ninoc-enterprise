const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: {
    transport: ws
  }
});

async function run() {
  console.log("Fetching products with price < 1000...");
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price')
    .lt('price', 1000);

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Found ${products.length} products to fix:`, products);

  for (const product of products) {
    const newPrice = product.price * 1000;
    console.log(`Updating ${product.name}: ${product.price} -> ${newPrice}`);
    const { error: updateError } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Error updating ${product.name}:`, updateError);
    } else {
      console.log(`Successfully updated ${product.name}!`);
    }
  }
}

run();
