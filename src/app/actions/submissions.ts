'use server';

import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeAuditData } from '@/lib/utils/auditLogger';
import { revalidatePath } from 'next/cache';

export interface ActionResponse {
  success: boolean;
  message?: string;
}

export async function processSubmission(
  submissionId: string, 
  action: 'approve' | 'reject', 
  payload: { reason?: string; markupAmount?: number }
): Promise<ActionResponse> {
  const supabase = await createClient();
  
  // 1. Authenticate & Authorize Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Unauthorized' };
  }
  
  const adminEmail = user.email || 'unknown_admin';

  // Security Check: Is the user actually an admin?
  const { data: adminRole } = await supabaseAdmin
    .from('admin_roles')
    .select('role')
    .eq('email', adminEmail)
    .single();
    
  // Allow super_admin or finance
  if (!adminRole || (adminRole.role !== 'super_admin' && adminRole.role !== 'finance')) {
    return { success: false, message: 'Forbidden: Insufficient privileges.' };
  }

  // 2. Fetch the submission from the database securely.
  // NEVER trust the client to provide base_hpp, category, or supplier details.
  const { data: sub, error: subError } = await supabaseAdmin
    .from('supplier_product_submissions')
    .select('*, suppliers(name, supplier_code, pillar, assigned_hub_id), categories(name), sub_categories(name)')
    .eq('id', submissionId)
    .single();

  if (subError || !sub) {
    return { success: false, message: 'Submission not found or DB error.' };
  }

  if (sub.status !== 'pending') {
    return { success: false, message: 'Submission is no longer pending.' };
  }

  const actionTimestamp = new Date().toISOString();
  
  const oldSnapshot = {
    submission_id: sub.id,
    product_name: sub.product_name,
    base_hpp: sub.base_hpp,
    supplier_name: sub.suppliers?.name || 'N/A',
    supplier_id: sub.supplier_id,
    category: sub.categories?.name || 'Uncategorized',
    description: sub.description || '',
    images: sub.images || [],
    previous_status: 'pending'
  };

  try {
    if (action === 'reject') {
      const reason = payload.reason || 'No reason provided';
      
      // Step A: Update Status
      const { error: updateErr } = await supabaseAdmin
        .from('supplier_product_submissions')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', sub.id);
        
      if (updateErr) throw new Error('Failed to update submission status');

      // Step B: Write Audit Log securely from backend
      await writeServerAuditLog({
        adminEmail,
        actionType: 'REJECT_ALLOCATION',
        tableAffected: 'supplier_product_submissions',
        recordId: sub.id,
        oldData: oldSnapshot,
        newData: {
          ...oldSnapshot,
          status: 'rejected',
          rejection_reason: reason,
          rejected_by: adminEmail,
          rejected_at: actionTimestamp,
        }
      });
      
    } else if (action === 'approve') {
      const markupAmount = payload.markupAmount || 0;
      if (markupAmount <= 0) throw new Error('Markup amount must be greater than zero.');
      
      // SERVER-SIDE CALCULATION: Bulletproof pricing
      const sellingPrice = sub.base_hpp + markupAmount;
      const marginPct = sub.base_hpp > 0 ? ((markupAmount / sub.base_hpp) * 100).toFixed(2) : '0';
      const slug = sub.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Resolve supplier_code for SKU generation
      const supplierCode = sub.suppliers?.supplier_code || 'NNC-UNK-000';
      const catCode = sub.categories?.name
        ? sub.categories.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase()
        : 'GEN';
      const baseName = sub.product_name.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
      // Deterministic hash from product name for consistent SKU
      let nameHash = 0;
      for (let i = 0; i < sub.product_name.length; i++) {
        nameHash = sub.product_name.charCodeAt(i) + ((nameHash << 5) - nameHash);
      }
      const uniqueNum = Math.abs(nameHash % 900) + 100;
      const productCode = `${baseName}${uniqueNum}`;

      // Parse variants_data from submission
      const variantsData: { size: string; color: string; initial_stock: number }[] =
        Array.isArray(sub.variants_data) ? sub.variants_data : [];

      // Calculate total initial stock from variants
      const totalStock = variantsData.reduce((sum: number, v: any) => sum + (v.initial_stock || 0), 0);

      // IMPLEMENTATION OF COMPENSATING SAGA PATTERN (MANUAL ROLLBACK) TO PREVENT ORPHANED DATA
      // Step A: Insert Product
      const { data: newProduct, error: insertErr } = await supabaseAdmin
        .from('products')
        .insert([{
          name: sub.product_name,
          slug: slug,
          description: sub.description,
          price: sellingPrice,
          category_id: sub.category_id,
          supplier_id: sub.supplier_id,
          image_url: sub.images && sub.images.length > 0 ? sub.images[0] : null,
          weight_grams: sub.weight_grams || 0,
          
          // 🔥 NEW: Map missing critical schema fields to prevent silent data loss
          is_perishable: sub.suppliers?.pillar === 'FNB', // Auto-flag FnB as perishable
          warehouse_id: sub.suppliers?.assigned_hub_id || null, // Route to supplier's assigned hub
        }])
        .select()
        .single();
        
      if (insertErr || !newProduct) throw new Error('Failed to create product in active inventory: ' + (insertErr?.message || 'Unknown error'));

      // Step A.1: Insert product_variants with auto-generated SKUs
      if (variantsData.length > 0) {
        const variantRows = variantsData.map((v: any) => {
          const colorCode = (v.color || 'NON').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
          const sizeCode = (v.size || 'OS').toUpperCase();
          const sku = `${supplierCode}-${catCode}-${productCode}-${colorCode}-${sizeCode}`;
          return {
            product_id: newProduct.id,
            size: v.size || null,
            color: v.color || null,
            stock_quantity: v.initial_stock || 0,
            sku,
          };
        });

        const { error: variantErr } = await supabaseAdmin
          .from('product_variants')
          .insert(variantRows);

        if (variantErr) {
          await supabaseAdmin.from('products').delete().eq('id', newProduct.id); // Rollback
          throw new Error('Failed to insert product variants: ' + variantErr.message);
        }
      }

      // Step B: Insert Costing
      const { error: costErr } = await supabaseAdmin
        .from('product_costings')
        .insert([{
          product_id: newProduct.id,
          supplier_base_price: sub.base_hpp,
          ninoc_markup: markupAmount
        }]);
        
      if (costErr) {
        await supabaseAdmin.from('product_variants').delete().eq('product_id', newProduct.id); // Rollback
        await supabaseAdmin.from('products').delete().eq('id', newProduct.id); // Rollback
        throw new Error('Failed to insert product costings: ' + costErr.message);
      }

      // Step C: Update Submission Status
      const { error: updateErr } = await supabaseAdmin
        .from('supplier_product_submissions')
        .update({ status: 'approved' })
        .eq('id', sub.id);
        
      if (updateErr) {
        await supabaseAdmin.from('product_variants').delete().eq('product_id', newProduct.id); // Rollback
        await supabaseAdmin.from('product_costings').delete().eq('product_id', newProduct.id); // Rollback
        await supabaseAdmin.from('products').delete().eq('id', newProduct.id); // Rollback
        throw new Error('Failed to update submission status to approved.');
      }

      // Step D: Write Audit Log
      const generatedSkus = variantsData.map((v: any) => {
        const colorCode = (v.color || 'NON').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
        const sizeCode = (v.size || 'OS').toUpperCase();
        return `${supplierCode}-${catCode}-${productCode}-${colorCode}-${sizeCode}`;
      });

      await writeServerAuditLog({
        adminEmail,
        actionType: 'APPROVE_ALLOCATION',
        tableAffected: 'products',
        recordId: newProduct.id,
        oldData: oldSnapshot,
        newData: {
          ...oldSnapshot,
          status: 'approved',
          approved_by: adminEmail,
          approved_at: actionTimestamp,
          product_id: newProduct.id,
          product_slug: newProduct.slug,
          supplier_code: supplierCode,
          generated_skus: generatedSkus,
          pricing: {
            base_hpp_idr: sub.base_hpp,
            ninoc_markup_idr: markupAmount,
            ninoc_margin_pct: `${marginPct}%`,
            final_selling_price_idr: sellingPrice,
          },
          costing_record: {
            product_id: newProduct.id,
            supplier_base_price: sub.base_hpp,
            ninoc_markup: markupAmount,
          },
          variants_count: variantsData.length,
          total_initial_stock: totalStock,
        }
      });
    }

    revalidatePath('/admin');
    return { success: true };
    
  } catch (err: any) {
    console.error('[Action: processSubmission] Error:', err);
    return { success: false, message: err.message || 'Internal Server Error' };
  }
}

// ─── Internal Helper ──────────────────────────────────────────
async function writeServerAuditLog(entry: any) {
  await supabaseAdmin.from('admin_audit_logs').insert([{
    admin_email: entry.adminEmail,
    action_type: entry.actionType,
    table_affected: entry.tableAffected,
    record_id: entry.recordId,
    old_data: entry.oldData ? sanitizeAuditData(entry.oldData) : null,
    new_data: sanitizeAuditData(entry.newData),
    ip_address: 'SERVER_ACTION',
    user_agent: 'SERVER_ACTION'
  }]);
}

export async function getPendingSubmissions() {
  try {
    const { data, error } = await supabaseAdmin
      .from('supplier_product_submissions')
      .select(`
        *,
        suppliers(name, supplier_code, pillar, status, contact_email, contact_phone),
        categories(name),
        sub_categories(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('getPendingSubmissions Error:', err);
    return { success: false, message: err.message };
  }
}

export async function getSuppliersList() {
  try {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('id, name, pillar, status')
      .order('name');
      
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('getSuppliersList Error:', err);
    return { success: false, message: err.message };
  }
}

export async function getSupplierInventory(supplierId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, price, image_url, category, is_perishable, created_at,
        product_variants (id, size, color, stock_quantity, sku)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('getSupplierInventory Error:', err);
    return { success: false, message: err.message };
  }
}
