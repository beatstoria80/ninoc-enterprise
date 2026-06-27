const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function fixAddresses() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, shipping_address');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  for (const order of orders) {
    if (order.shipping_address && order.shipping_address.address) {
      let addr = order.shipping_address.address;
      // Match pattern like "40 JL.JAMIKA NO. 40"
      // If it starts with digits followed by space, and contains "NO. <same_digits>"
      const match = addr.match(/^(\d+)\s+(.+?)\s+NO\.?\s*\1/i);
      if (match) {
        console.log(`Fixing address for order ${order.id}`);
        console.log(`  Before: ${addr}`);
        const fixedAddr = `${match[2].trim()} No. ${match[1]}` + addr.substring(match[0].length);
        console.log(`  After:  ${fixedAddr}`);
        
        order.shipping_address.address = fixedAddr;
        
        await supabaseAdmin
          .from('orders')
          .update({ shipping_address: order.shipping_address })
          .eq('id', order.id);
      }
    }
  }
  console.log('Done fixing addresses.');
}

fixAddresses();
