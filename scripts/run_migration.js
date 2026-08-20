const { Client } = require('pg');
async function run() {
  const dbUrl = 'postgresql://postgres.esiapizmdpylhotojfij:Hitamputih%23100@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    console.log('Running migration: Add midtrans_fee and biteship_fee to product_costings...');
    await client.query(`
      ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS midtrans_fee DECIMAL(12, 2) DEFAULT 0 NOT NULL;
      ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS biteship_fee DECIMAL(12, 2) DEFAULT 0 NOT NULL;
    `);
    console.log('Migration successfully completed!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}
run();
