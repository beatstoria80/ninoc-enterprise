'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentSupplier } from '@/lib/services/supplier';

export async function updateSupplierProfile(prevState: any, formData: FormData) {
  try {
    const supplierUser = await getCurrentSupplier();
    
    if (!supplierUser || !supplierUser.supplier_id) {
      return { error: 'Unauthorized: No active supplier session found.' };
    }

    const name = formData.get('name') as string;
    const contact_email = formData.get('contact_email') as string;
    const contact_phone = formData.get('contact_phone') as string;

    if (!name || name.trim() === '') {
      return { error: 'Company Name is required.' };
    }

    // Use admin client to bypass the known infinite recursion RLS issue on supplier_users
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('suppliers')
      .update({
        name,
        contact_email,
        contact_phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supplierUser.supplier_id);

    if (error) {
      console.error('[Action] Error updating supplier profile:', error);
      return { error: 'Failed to update profile. Database error.' };
    }

    revalidatePath('/supplier/settings');
    revalidatePath('/supplier');

    return { success: true };
  } catch (err: any) {
    console.error('[Action] Unhandled exception in updateSupplierProfile:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
