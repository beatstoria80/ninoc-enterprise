const { Client } = require('pg');
async function run() {
  const dbUrl = 'postgresql://postgres.esiapizmdpylhotojfij:Hitamputih%23100@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const resUsers = await client.query("SELECT id, email, raw_user_meta_data FROM auth.users WHERE email ILIKE 'admin@ninoc.store';");
    console.log('Auth Users:', resUsers.rows);

    const resRoles = await client.query("SELECT * FROM public.admin_roles;");
    console.log('Admin Roles:', resRoles.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
