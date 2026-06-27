const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let envContent = '';
try {
  envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
} catch (e) {
  envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
}

let supabaseKey = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabaseUrl = 'https://esiapizmdpylhotojfij.supabase.co';
const adminClient = createClient(supabaseUrl, supabaseKey);

async function testApiLogic() {
  console.log("Fetching retur_requests...");
  const { data: returRequests, error, count } = await adminClient
    .from('retur_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 49);

  if (error) {
    console.error("Error fetching retur:", error);
    return;
  }

  console.log("Retur fetched:", returRequests.length);

  console.log("Checking order_items table structure...");
  const { data: itemSample, error: itemError } = await adminClient
    .from('order_items')
    .select('*')
    .limit(1);
    
  if (itemError) {
    console.error(itemError);
  } else if (itemSample.length > 0) {
    console.log("Columns:", Object.keys(itemSample[0]));
    console.log("Sample Data:", JSON.stringify(itemSample[0], null, 2));
  } else {
    console.log("No order items found");
  }
}

testApiLogic();
