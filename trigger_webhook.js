require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws }, auth: { persistSession: false } });

async function triggerWebhook() {
  const { data: orders } = await supabase.from('orders').select('id, midtrans_id, status').order('created_at', { ascending: false }).limit(1);
  if (orders && orders.length > 0) {
    const order = orders[0];
    console.log('Latest Order:', order.id);
    
    // Simulate webhook
    const payload = {
      order_id: order.id,
      transaction_id: 'dummy-sandbox-tx-id-12345',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      status_code: '200',
      gross_amount: '178999.00'
    };
    
    const fetch = require('node-fetch');
    try {
      const res = await fetch('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      console.log('Webhook Response:', text);
    } catch(err) {
      console.error('Fetch error:', err);
    }
  } else {
    console.log('No orders found');
  }
}
triggerWebhook();
