import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const email = 'denim@ninoc.store';
  const password = 'akses123!';

  console.log('Creating auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId;
  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists, finding ID...');
      const { data: usersData } = await supabase.auth.admin.listUsers();
      userId = usersData.users.find(u => u.email === email)?.id;
    } else {
      console.error('Auth Error:', authError);
      return;
    }
  } else {
    userId = authData.user.id;
  }

  console.log('User ID:', userId);

  console.log('Checking existing supplier user mapping...');
  const { data: existingMapping } = await supabase.from('supplier_users').select('supplier_id').eq('user_id', userId).single();
  
  if (existingMapping) {
    console.log('Mapping already exists:', existingMapping);
    
    // Update supplier name to empty
    await supabase.from('suppliers').update({ name: '' }).eq('id', existingMapping.supplier_id);
    console.log('Updated existing supplier name to empty string.');
    return;
  }

  console.log('Creating supplier record...');
  const { data: supplier, error: supError } = await supabase
    .from('suppliers')
    .insert({
      name: '',
      contact_email: email,
      contact_phone: '081234567890',
      status: 'approved'
    })
    .select()
    .single();

  if (supError) {
    console.error('Supplier Insert Error:', supError);
    return;
  }

  console.log('Creating mapping...');
  const { error: mappingError } = await supabase
    .from('supplier_users')
    .insert({
      supplier_id: supplier.id,
      user_id: userId,
      role: 'admin'
    });

  if (mappingError) {
    console.error('Mapping Error:', mappingError);
  } else {
    console.log('SUCCESS! Account created: denim@ninoc.store');
  }
}

run();
