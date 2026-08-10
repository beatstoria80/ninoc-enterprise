import { sendCheckoutPendingWA } from './src/lib/whatsapp';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  console.log('Sending test WA message...');
  const result = await sendCheckoutPendingWA({
    phone: '6285722341018',
    customer_name: 'Test Customer',
    order_id: 'TEST-1234',
    estimated_delivery: '2-5 hari kerja'
  });
  console.log('Result:', result);
}

run().catch(console.error);
