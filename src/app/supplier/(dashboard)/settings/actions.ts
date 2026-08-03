'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentSupplier } from '@/lib/services/supplier';

export async function updateSupplierProfile(formData: FormData) {
  const supplierUser = await getCurrentSupplier();
  
  if (!supplierUser || !supplierUser.supplier_id) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const contact_email = formData.get('contact_email') as string;
  const contact_phone = formData.get('contact_phone') as string;

  if (!name) {
    throw new Error('Name is required');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('suppliers')
    .update({
      name,
      contact_email,
      contact_phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', supplierUser.supplier_id);

  if (error) {
    console.error('Error updating supplier profile:', error);
    throw new Error('Failed to update profile');
  }

  revalidatePath('/supplier/settings');
  revalidatePath('/supplier');
}
