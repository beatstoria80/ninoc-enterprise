const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearFakeData() {
  console.log("Starting data deletion...");

  try {
    // Due to foreign keys, order deletion might cascade. 
    // Just in case, delete from dependent tables first if cascade is not set.
    // It's usually safer to delete the root `orders` and let cascade handle it, or delete all sequentially.
    
    // We will delete all orders where status is not null (which is all of them)
    // Supabase requires a filter for delete. We can use .neq('id', 'dummy-id')
    
    console.log("Deleting retur_requests...");
    const { error: err0 } = await supabase.from('retur_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err0) console.log("Warning (retur_requests):", err0.message);

    console.log("Deleting supplier_ledgers...");
    const { error: err1 } = await supabase.from('supplier_ledgers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) console.log("Warning (supplier_ledgers):", err1.message);

    console.log("Deleting affiliate_commissions...");
    const { error: err2 } = await supabase.from('affiliate_commissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err2) console.log("Warning (affiliate_commissions):", err2.message);

    console.log("Deleting order_items...");
    const { error: err3 } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err3) console.log("Warning (order_items):", err3.message);

    console.log("Deleting orders...");
    const { error: err4 } = await supabase.from('orders').delete().neq('status', 'nonexistent_status_123');
    if (err4) {
       console.error("Error deleting orders:", err4);
    } else {
       console.log("Successfully deleted all orders.");
    }

    console.log("Cleanup finished.");
  } catch (error) {
    console.error("Error during execution:", error);
  }
}

clearFakeData();
