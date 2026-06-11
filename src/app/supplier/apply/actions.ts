'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function submitSupplierApplication(formData: FormData) {
  const cookieStore = await cookies();
  
  // 1. Get the current user session using SSR client
  const supabaseSsr = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in server action
          }
        },
      },
    }
  );

  const { data: { session }, error: authError } = await supabaseSsr.auth.getSession();
  if (!session || authError) {
    throw new Error('You must be logged in to apply.');
  }

  const name = formData.get('legal_name') as string;
  const legal_entity_type = formData.get('legal_entity') as string;
  const director_name = formData.get('director_name') as string;
  const tax_id = formData.get('tax_id') as string;
  const business_registration_number = formData.get('nib') as string;
  
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const agreeToSla = formData.get('agree_sla') === 'on';

  const id_card_url = formData.get('ktp_url') as string;
  const tax_id_url = formData.get('npwp_url') as string;
  const business_license_url = formData.get('nib_url') as string;

  if (!name || !email || !phone || !director_name || !tax_id) {
    throw new Error('Please fill in all required fields.');
  }

  if (!agreeToSla) {
    throw new Error('You must agree to the NINOC OEM Terms & Conditions.');
  }

  if (!id_card_url || !tax_id_url || !business_license_url) {
    throw new Error('All KYC legal documents are required for integrity validation.');
  }

  // 2. Use Admin Client to bypass RLS for inserting new supplier
  // (Because RLS does not allow inserting into suppliers if they aren't one yet)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Insert into suppliers
  const { data: supplier, error: supplierError } = await supabaseAdmin
    .from('suppliers')
    .insert({
      name,
      legal_name: name,
      legal_entity_type,
      director_name,
      tax_id,
      business_registration_number,
      contact_email: email,
      contact_phone: phone,
      id_card_url,
      tax_id_url,
      business_license_url,
      status: 'pending'
    })
    .select()
    .single();

  if (supplierError) {
    console.error('Error creating supplier:', supplierError);
    throw new Error('Failed to submit application. Please try again later.');
  }

  // Link user to supplier
  const { error: userError } = await supabaseAdmin
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
