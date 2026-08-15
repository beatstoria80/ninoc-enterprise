import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

/**
 * Cached service to get the current supplier's identity.
 * This prevents N+1 queries across layouts and nested server components.
 */
export const getCurrentSupplier = cache(async () => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  // Create an admin client to bypass the broken RLS infinite recursion on supplier_users
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: supplierUser, error } = await supabaseAdmin
    .from('supplier_users')
    .select('*, suppliers(name, description, status, contact_email, contact_phone, bank_name, bank_account_number, bank_account_holder)')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();

  if (!supplierUser || error) {
    console.error("getCurrentSupplier Error:", error);
    return null;
  }

  // Detect Pillar based on the latest product's category
  let pillar = 'FASHION';
  const { data: productCheck } = await supabaseAdmin
    .from('products')
    .select('category')
    .eq('supplier_id', supplierUser.supplier_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (productCheck && productCheck.category) {
    const cat = String(productCheck.category).toLowerCase();
    if (cat === 'utilities' || cat === 'fnb' || cat === 'pantry') {
      pillar = 'FNB';
    }
  }

  // Fetch assigned warehouse based on Pillar mapping
  let warehouseQuery = supabaseAdmin.from('warehouses').select('*').eq('is_active', true);
  if (pillar === 'FNB') {
    // Default to F&B Hub
    warehouseQuery = warehouseQuery.eq('code', 'WH-BANDUNG-FB');
  } else {
    // Default to Main Hub for Fashion/Goods
    warehouseQuery = warehouseQuery.eq('code', 'WH-BANDUNG-01'); // Using main hub as default for Fashion per plan
  }
  
  const { data: warehouseData } = await warehouseQuery.limit(1).maybeSingle();
  
  // If the specific hub fails, fallback to any primary hub
  let assignedWarehouse = warehouseData;
  if (!assignedWarehouse) {
    const { data: fallbackWarehouse } = await supabaseAdmin
      .from('warehouses')
      .select('*')
      .eq('is_primary', true)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    assignedWarehouse = fallbackWarehouse;
  }

  return {
    ...supplierUser,
    pillar,
    assignedWarehouse,
    session,
  };
});
