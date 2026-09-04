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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      return { success: true, data: [], debugContext: `Missing ENV! URL: ${!!url}, KEY: ${!!key}` };
    }

    const supabase = createClient(
      url,
      key,
      {
        auth: { persistSession: false },
        global: {
          fetch: (url: RequestInfo | URL, options?: RequestInit) => {
            return fetch(url.toString(), { ...options, cache: 'no-store', next: { revalidate: 0 } });
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
      
      if (prodFallback) {
        if (prodFallback.length === 0) {
           return { success: true, data: prodFallback, debugContext: `prodFallback returned 0. URL used: ${url}` };
        }
        return { success: true, data: prodFallback };
      }
    }
    
    const finalData = prodWithSuppliers || [];
    if (finalData.length === 0) {
      return { 
        success: true, 
        data: [], 
        debugContext: `FALLTHROUGH: prodWithSuppliers was ${JSON.stringify(prodWithSuppliers)}. Error was ${JSON.stringify(prodError)}` 
      };
    }

    // Force strict serialization to strip any hidden prototypes or non-serializable objects that crash Next.js Server Actions
    const safeData = JSON.parse(JSON.stringify(finalData));
    return { success: true, data: safeData };
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
