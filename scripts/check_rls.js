const { Client } = require('pg');
async function run() {
  const dbUrl = 'postgresql://postgres.esiapizmdpylhotojfij:Hitamputih%23100@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'orders';
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}
run();
