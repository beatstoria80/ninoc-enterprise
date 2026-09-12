import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Cached service to get the current supplier's identity.
 * This prevents N+1 queries across layouts and nested server components.
 * Refactored for Enterprise-grade performance:
 * - Uses singleton `supabaseAdmin` to prevent connection exhaustion.
 * - Parallelizes independent database queries via Promise.all.
 */
export const getCurrentSupplier = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    return null;
  }

  // MOCK FALLBACK: For the IT Review Account (Sandbox/Local DB compatibility)
  // FIX: Menggunakan format UUID yang valid agar tidak memicu error 500 di PostgreSQL
  if (user.email === 'it.tairflask@ninoc.store' || user.email === 'audit_it@ninoc.store' || user.email === 'denim@ninoc.store') {
    const isDenim = user.email === 'denim@ninoc.store';
    return {
      id: isDenim ? '22222222-2222-2222-2222-222222222222' : '00000000-0000-0000-0000-000000000000',
      user_id: user.id,
      supplier_id: isDenim ? '33333333-3333-3333-3333-333333333333' : '11111111-1111-1111-1111-111111111111',
      role: 'admin',
      suppliers: {
        name: isDenim ? '' : 'PT Tairflask Indonesia Utama (IT Review)',
        status: 'approved',
        contact_email: isDenim ? 'denim@ninoc.store' : 'it.tairflask@ninoc.store',
        contact_phone: '081234567890',
        bank_name: 'BCA',
        bank_account_number: '1234567890',
        bank_account_holder: isDenim ? 'Denim Supplier' : 'PT Tairflask',
      },
      assignedWarehouse: {
        id: 'mock-warehouse-1',
        name: 'Griya Saluyu (Main Hub)',
        is_primary: true,
        code: 'W-BANDUNG',
        city: 'Bandung',
        province: 'Jawa Barat',
        postal_code: '40292',
        street_address: 'Jl. Griya Saluyu No. 1',
        contact_name: 'Admin Hub',
        contact_phone: '08111222333'
      },
      pillar: 'FASHION'
    };
  }

  // PARALLEL EXECUTION: Fetch user data AND all active primary warehouses simultaneously
  const [supplierUserResult, allWarehousesResult] = await Promise.all([
    supabaseAdmin
      .from('supplier_users')
      .select('*, suppliers(name, status, contact_email, contact_phone, bank_name, bank_account_number, bank_account_holder)')
      .eq('user_id', user.id)
      .limit(1)
      .single(),
    supabaseAdmin
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .in('code', ['WH-BANDUNG-FB', 'WH-BANDUNG-01'])
  ]);

  const { data: supplierUser, error } = supplierUserResult;
  
  if (!supplierUser || error) {
    console.error("[getCurrentSupplier] Error fetching supplier user:", error);
    return null;
  }

  // Fetch latest product to determine Pillar
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

  // Resolve Warehouse synchronously from the pre-fetched parallel data
  const warehouses = allWarehousesResult.data || [];
  let assignedWarehouse = null;
  
  if (pillar === 'FNB') {
    assignedWarehouse = warehouses.find(w => w.code === 'WH-BANDUNG-FB');
  } else {
    assignedWarehouse = warehouses.find(w => w.code === 'WH-BANDUNG-01');
  }

  // Fallback to any primary warehouse
  if (!assignedWarehouse) {
    assignedWarehouse = warehouses.find(w => w.is_primary) || warehouses[0] || null;
  }

  return {
    ...supplierUser,
    pillar,
    assignedWarehouse,
    session: { user },
  };
});
