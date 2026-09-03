'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { Product } from '@/components/admin/types';

// Utility to verify admin role
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  if (user.email?.toLowerCase() === 'admin@ninoc.store') {
    return await createAdminClient();
  }

  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('email', user.email?.toLowerCase() || '')
    .single();

  if (!roleData) throw new Error('Unauthorized');
  
  return await createAdminClient();
}

export async function fetchProductsAction() {
  try {
    await verifyAdmin();
    
    // Create an explicit, raw client to guarantee no cache and no RLS
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: {
          fetch: (url: RequestInfo | URL, options?: RequestInit) => {
            // Add a timestamp query param to aggressively bust any Vercel/Supabase Edge caching
            const bustUrl = new URL(url.toString());
            bustUrl.searchParams.append('bust', Date.now().toString());
            return fetch(bustUrl.toString(), { ...options, cache: 'no-store' });
          }
        }
      }
    );
    
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
      
      if (prodFallback && prodFallback.length === 0) {
         throw new Error(`DEBUG: URL=${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0,25)}... KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0,10)}...`);
      }
      return { success: true, data: prodFallback };
    }
    
    if (prodWithSuppliers && prodWithSuppliers.length === 0) {
         throw new Error(`DEBUG: URL=${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0,25)}... KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0,10)}...`);
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
