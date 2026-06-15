require('dotenv').config({path: '.env.local'});
const { sendEmailInvoice } = require('./src/lib/email');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws }, auth: { persistSession: false } });

async function testEmail() {
  const {data: order} = await supabase.from('orders').select('*, order_items(*, products(*))').eq('id', 'NINOC-1781502588553').single();
  if(order) {
    try {
      await sendEmailInvoice(order, order.shipping_address.email || 'ninocenterprise@gmail.com');
      console.log('Email sent successfully!');
    } catch (e) {
      console.error('Failed:', e);
    }
  }
}
testEmail();
