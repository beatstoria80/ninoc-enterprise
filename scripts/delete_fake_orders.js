require('dotenv').config({ path: '.env.local' });
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllOrders() {
  console.log('Connecting to Supabase to delete orders...');
  
  // order_items might need to be deleted first due to foreign keys, or it cascades.
  // We'll delete order_items first to be safe.
  const { error: errItems } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errItems) {
    console.error('Error deleting order items:', errItems);
  } else {
    console.log('Order items deleted successfully.');
  }

  const { error: errOrders } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errOrders) {
    console.error('Error deleting orders:', errOrders);
  } else {
    console.log('Orders deleted successfully.');
  }
}

deleteAllOrders();
