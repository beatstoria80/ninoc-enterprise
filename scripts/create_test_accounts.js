const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const usersToCreate = [
    { email: 'admin@ninoc.store', password: 'NinocAdmin2026!', role: 'admin' },
    { email: 'audit_it@ninoc.store', password: 'akses123!', role: 'supplier' }
  ];

  for (const u of usersToCreate) {
    console.log(`Checking ${u.email}...`);
    // Create the user in auth.users
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role }
    });
    
    if (error) {
      if (error.message.includes('already exists') || error.status === 422) {
        console.log(`User ${u.email} already exists. Updating password...`);
        const { data: searchRes } = await supabase.auth.admin.listUsers();
        const existing = searchRes?.users?.find(x => x.email === u.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password: u.password, user_metadata: { role: u.role } });
          console.log(`Updated password for ${u.email}`);
        }
      } else {
        console.error(`Failed to create ${u.email}:`, error);
      }
    } else {
      console.log(`Created user ${u.email}`);
    }

    if (u.role === 'admin') {
      console.log('Ensuring admin_roles entry...');
      await supabase.from('admin_roles').upsert({ email: u.email, role: 'super_admin' }, { onConflict: 'email' });
    }
    
    if (u.role === 'supplier') {
      console.log('Ensuring supplier entry for audit_it...');
      // Find PT Tairflask
      const { data: supplier } = await supabase.from('suppliers').select('id').eq('name', 'PT Tairflask Indonesia Utama').single();
      if (supplier && user?.user?.id) {
        await supabase.from('supplier_users').upsert({ user_id: user.user.id, supplier_id: supplier.id, role: 'admin' });
      }
    }
  }
}

run();
