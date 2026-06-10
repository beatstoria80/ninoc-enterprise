'use server';

import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function submitSupplierApplication(formData: FormData) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to apply.');
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const agreeToSla = formData.get('agree_sla') === 'on';

  if (!name || !email || !phone) {
    throw new Error('Please fill in all required fields.');
  }

  if (!agreeToSla) {
    throw new Error('You must agree to the NINOC OEM Terms & Conditions.');
  }

  // Insert into suppliers
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .insert({
      name,
      contact_email: email,
      contact_phone: phone,
      status: 'pending'
    })
    .select()
    .single();

  if (supplierError) {
    console.error('Error creating supplier:', supplierError);
    throw new Error('Failed to submit application. Please try again later.');
  }

  // Link user to supplier
  const { error: userError } = await supabase
    .from('supplier_users')
    .insert({
      supplier_id: supplier.id,
      user_id: session.user.id,
      role: 'owner'
    });

  if (userError) {
    console.error('Error linking user:', userError);
    throw new Error('Failed to setup your account. Please contact support.');
  }

  redirect('/supplier');
}
