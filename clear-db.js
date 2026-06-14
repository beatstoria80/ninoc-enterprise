require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

async function fetchSupabase(endpoint, method = 'GET', body = null) {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  if (response.status === 204) return null;
  return await response.json();
}

async function clearTestOrders() {
  console.log("Starting database cleanup...");
  
  try {
    // 1. Get all orders
    console.log("Fetching orders...");
    const orders = await fetchSupabase('orders?select=id');
      
    if (!orders || orders.length === 0) {
      console.log("No orders found to delete.");
      return;
    }

    const orderIds = orders.map(o => o.id);
    const idList = `(${orderIds.join(',')})`;
    console.log(`Found ${orderIds.length} orders. Deleting related items...`);

    // 2. Delete order_items
    console.log("Deleting order items...");
    await fetchSupabase(`order_items?order_id=in.${idList}`, 'DELETE');
    console.log("✅ Deleted order items");

    // 3. Delete orders
    console.log("Deleting orders...");
    await fetchSupabase(`orders?id=in.${idList}`, 'DELETE');
    console.log("✅ Deleted orders");
    
    // 4. Delete customer_activity (test tracking events)
    console.log("Deleting customer activity...");
    await fetchSupabase(`customer_activity?id=neq.00000000-0000-0000-0000-000000000000`, 'DELETE');
    console.log("✅ Deleted customer activity");

    console.log("🎉 Database cleanup complete! Ready for E2E testing.");

  } catch (error) {
    console.error("❌ Error cleaning database:", error.message);
  }
}

clearTestOrders();
