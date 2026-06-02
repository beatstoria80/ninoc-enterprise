const { Client } = require('pg');
async function run() {
  const dbUrl = 'postgresql://postgres.esiapizmdpylhotojfij:Hitamputih%23100@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    // Add policies for ANYONE to see all orders and order_items (for QA testing without login)
    await client.query(`
      DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
      DROP POLICY IF EXISTS "Anyone can view all orders" ON orders;
      CREATE POLICY "Anyone can view all orders" ON orders FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Admin can view all order items" ON order_items;
      DROP POLICY IF EXISTS "Anyone can view all order items" ON order_items;
      CREATE POLICY "Anyone can view all order items" ON order_items FOR SELECT USING (true);
    `);
    console.log('Public policies added successfully.');
  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}
run();
