const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let envContent = '';
try {
  envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
} catch (e) {
  try {
    envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  } catch (err) {
    console.error('No .env or .env.local found');
    process.exit(1);
  }
}

let supabaseKey = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabaseUrl = 'https://esiapizmdpylhotojfij.supabase.co';

if (!supabaseKey) {
  console.error("Could not find SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getReturOrders() {
  const { data, error } = await supabase
    .from('retur_requests')
    .select('order_id, status, created_at, reason');
    
  if (error) {
    console.error('Error fetching retur requests:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("Tidak ada data retur di database.");
    return;
  }
  
  console.log("Daftar Nomor Order yang diretur:");
  data.forEach(item => {
    console.log(`- Order ID: ${item.order_id} (Status: ${item.status}, Alasan: ${item.reason})`);
  });
}

getReturOrders();
