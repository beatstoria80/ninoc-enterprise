const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://esiapizmdpylhotojfij.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaWFwaXptZHB5bGhvdG9qZmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTM2NSwiZXhwIjoyMDkzNjgxMzY1fQ.h5xqrEfnLK0BGRHKgOUwy3MAshvpBuC8HjNI080Iuk4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: ws } // <--- this fixes the node 20 issue
});

async function clearData() {
  console.log('Clearing transaction data...');

  try {
    // We clear child tables first if there are foreign keys, but Supabase SDK delete all by default if we neq id 0.
    
    // Delete from order_items (usually child of orders)
    console.log('Deleting order_items...');
    await supabase.from('order_items').delete().neq('id', 'dummy');

    // Delete from orders
    console.log('Deleting orders...');
    await supabase.from('orders').delete().neq('id', 'dummy');

    // Delete from payments
    console.log('Deleting payments...');
    await supabase.from('payments').delete().neq('id', 'dummy');

    // Delete from finance_summary
    console.log('Deleting finance_summary...');
    await supabase.from('finance_summary').delete().neq('id', 'dummy');

    // Delete from operational_expenses
    console.log('Deleting operational_expenses...');
    await supabase.from('operational_expenses').delete().neq('id', 'dummy');
    
    // Delete from wa_broadcast_sessions and queue
    console.log('Deleting wa_broadcast_queue...');
    await supabase.from('wa_broadcast_queue').delete().neq('id', 'dummy');
    console.log('Deleting wa_broadcast_sessions...');
    await supabase.from('wa_broadcast_sessions').delete().neq('id', 'dummy');

    console.log('All transaction data cleared successfully!');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

clearData();
