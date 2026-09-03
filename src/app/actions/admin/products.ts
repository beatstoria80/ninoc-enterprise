'use server';

import { createClient } from '@/utils/supabase/server';
import { Product } from '@/components/admin/types';

// Utility to verify admin role
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  if (user.email?.toLowerCase() === 'admin@ninoc.store') return supabase;

  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('email', user.email?.toLowerCase() || '')
    .single();

  if (!roleData) throw new Error('Unauthorized');
  
  return supabase;
}

export async function fetchProductsAction() {
  try {
    const supabase = await verifyAdmin();
    
    const { data: prodWithSuppliers, error: prodError } = await supabase
      .from('products')
      .select('*, variants(*), suppliers(name)')
      .order('created_at', { ascending: false });
    
    if (prodError) {
      console.warn('[Admin] suppliers join failed (likely RLS), falling back without suppliers:', prodError.message);
      const { data: prodFallback, error: fallbackError } = await supabase
        .from('products')
        .select('*, variants(*)')
        .order('created_at', { ascending: false });
      
      if (fallbackError) throw fallbackError;
      return { success: true, data: prodFallback };
    }
    
    return { success: true, data: prodWithSuppliers };
  } catch (error: any) {
    console.error('fetchProductsAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleFeaturedAction(productId: string, currentStatus: boolean) {
  try {
    const supabase = await verifyAdmin();
    const { error } = await supabase
      .from('products')
      .update({ is_featured: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProductAction(productId: string) {
  // Can reuse existing /api/admin/products/delete endpoint or implement here
  try {
    const supabase = await verifyAdmin();
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
