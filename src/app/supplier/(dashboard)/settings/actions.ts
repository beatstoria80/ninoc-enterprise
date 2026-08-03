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
    const description = formData.get('description') as string;
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
        description,
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

export async function updateSupplierBankDetails(prevState: any, formData: FormData) {
  try {
    const supplierUser = await getCurrentSupplier();
    
    if (!supplierUser || !supplierUser.supplier_id) {
      return { error: 'Unauthorized: No active supplier session found.' };
    }

    const bank_name = formData.get('bank_name') as string;
    const bank_account_number = formData.get('bank_account_number') as string;
    const bank_account_holder = formData.get('bank_account_holder') as string;

    if (!bank_name || !bank_account_number || !bank_account_holder) {
      return { error: 'All banking fields are required.' };
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('suppliers')
      .update({
        bank_name,
        bank_account_number,
        bank_account_holder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supplierUser.supplier_id);

    if (error) {
      console.error('[Action] Error updating bank profile:', error);
      return { error: 'Failed to update banking details. Database error.' };
    }

    revalidatePath('/supplier/settings');

    return { success: true };
  } catch (err: any) {
    console.error('[Action] Unhandled exception in updateSupplierBankDetails:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function sendPasswordResetEmail() {
  try {
    const supplierUser = await getCurrentSupplier();
    
    if (!supplierUser || !supplierUser.user_id) {
      return { error: 'Unauthorized: No active supplier session found.' };
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(supplierUser.user_id);
    
    if (authError || !user?.email) {
      return { error: 'Could not fetch user email.' };
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store'}/supplier/settings?tab=account`,
    });

    if (error) {
      console.error('[Action] Error sending password reset:', error);
      return { error: 'Failed to send password reset email.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Action] Unhandled exception in sendPasswordResetEmail:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
