const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const dbUrl = 'postgresql://postgres.esiapizmdpylhotojfij:Hitamputih%23100@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    console.log('Running migration: Inbound QC Atomic RPC...');
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260820_inbound_qc_atomic.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('Migration successfully completed!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}
run();

