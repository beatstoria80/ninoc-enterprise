const { Client } = require('pg');
async function run() {
  const dbUrl = 'postgresql://postgres.esiapizmdpylhotojfij:Hitamputih%23100@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    console.log('Ensuring admin_roles table exists and adding admin@ninoc.store...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admin_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      
      INSERT INTO public.admin_roles (email, role) 
      VALUES ('admin@ninoc.store', 'super_admin') 
      ON CONFLICT (email) DO UPDATE SET role = 'super_admin';
    `);
    console.log('Successfully added admin@ninoc.store to admin_roles!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}
run();
