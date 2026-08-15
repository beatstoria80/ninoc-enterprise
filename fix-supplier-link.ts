import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSupplierLink() {
  const email = 'supplier_test@ninoc.store';

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error('List users error:', listError); return; }

  const user = users.find(u => u.email === email);
  if (!user) { console.error(`User ${email} not found in auth.users`); return; }
  console.log(`Found user: ${user.id} (${user.email})`);

  const { data: existingLink, error: linkCheckError } = await supabase
    .from('supplier_users')
    .select('*, suppliers(id, name, status)')
    .eq('user_id', user.id);

  console.log('Existing supplier_users link:', JSON.stringify(existingLink, null, 2));
  if (linkCheckError) console.error('Link check error:', linkCheckError);

  if (existingLink && existingLink.length > 0) {
    console.log('Link already exists! Checking supplier status...');
    const supplier = existingLink[0].suppliers;
    console.log('Supplier:', JSON.stringify(supplier, null, 2));
    if (supplier && supplier.status !== 'active') {
      console.log('Activating supplier...');
      await supabase.from('suppliers').update({ status: 'active' }).eq('id', supplier.id);
      console.log('Supplier activated!');
    } else {
      console.log('Supplier is already active. Everything looks good!');
    }
    return;
  }

  const { data: existingSupplier } = await supabase
    .from('suppliers')
    .select('id, name, status')
    .eq('contact_email', email);

  console.log('Existing suppliers:', JSON.stringify(existingSupplier, null, 2));

  let supplierId;

  if (existingSupplier && existingSupplier.length > 0) {
    supplierId = existingSupplier[0].id;
    console.log(`Using existing supplier: ${supplierId}`);
    await supabase.from('suppliers').update({ status: 'active' }).eq('id', supplierId);
  } else {
    const { data: newSupplier, error: createError } = await supabase
      .from('suppliers')
      .insert({
        name: 'PT Dummy Supplier Logistics',
        contact_email: email,
        contact_phone: '081234567890',
        status: 'active'
      })
      .select('id')
      .single();

    if (createError) { console.error('Create supplier error:', createError); return; }
    supplierId = newSupplier.id;
    console.log(`Created new supplier: ${supplierId}`);
  }

  const { error: linkError } = await supabase
    .from('supplier_users')
    .insert({
      supplier_id: supplierId,
      user_id: user.id,
      role: 'owner'
    });

  if (linkError) { console.error('Link error:', linkError); return; }

  console.log('--- FIX COMPLETE ---');
  console.log(`User ${email} is now linked to supplier ${supplierId} as owner.`);
  console.log('You can now access /supplier dashboard.');
}

fixSupplierLink();
