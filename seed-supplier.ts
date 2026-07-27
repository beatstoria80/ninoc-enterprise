import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedSupplier() {
  console.log('Seeding dummy supplier account...');

  const email = 'supplier_test@ninoc.store';
  const password = 'Password123!';

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Supplier Admin Tester' }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
         console.log('User already exists in auth.users, trying to fetch...');
      } else {
         throw authError;
      }
    }

    // Since admin API doesn't easily return the user if already exists, let's just use the returned one or get by email.
    // Assuming clean state for the test email.
    if (!authData?.user?.id) {
       console.log('Could not get user ID, might already exist. Delete it first manually if needed, or check Supabase.');
       return;
    }
    const userId = authData.user.id;
    console.log(`Created Auth User: ${userId}`);

    // 2. Create Supplier
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        name: 'PT Dummy Supplier Logistics',
        contact_email: email,
        contact_phone: '081234567890',
        status: 'active'
      })
      .select('id')
      .single();

    if (supplierError) throw supplierError;
    const supplierId = supplierData.id;
    console.log(`Created Supplier: ${supplierId}`);

    // 3. Link User to Supplier
    const { error: linkError } = await supabase
      .from('supplier_users')
      .insert({
        supplier_id: supplierId,
        user_id: userId,
        role: 'owner'
      });

    if (linkError) throw linkError;

    console.log('--- SEEDING COMPLETE ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: owner`);
    console.log('You can now log in at http://localhost:3000/login and access /supplier/logistics');

  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

seedSupplier();
