import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { withErrorHandler, apiSuccess, apiBadRequest } from '@/lib/apiResponse';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { isEditMode, editingProductId, productData, allVariants } = body;

  if (!productData || !productData.name) {
    return apiBadRequest('Product name is required');
  }

  const supabase = getSupabaseAdmin();
  let productId = editingProductId;

  // 1. Insert or Update Product
  if (isEditMode && productId) {
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...productData, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    productId = data.id;
  }

  // 2. Handle Variants (Batch Processing to eliminate N+1 loop bottlenecks)
  if (productId && allVariants && Array.isArray(allVariants)) {
    const variantsWithProductId = allVariants.map((v: any) => ({ ...v, product_id: productId }));

    // Fetch existing variants to identify deletions
    const { data: existingVariants } = await supabase
      .from('variants')
      .select('id')
      .eq('product_id', productId);
      
    const newVariantIds = variantsWithProductId.map((v: any) => v.id).filter(Boolean);
    const variantsToDelete = existingVariants?.filter((ev: any) => !newVariantIds.includes(ev.id)) || [];

    // O(1) Batch Delete instead of N+1 serial loop
    if (variantsToDelete.length > 0) {
      const idsToDelete = variantsToDelete.map((ev: any) => ev.id);
      const { error: delErr } = await supabase.from('variants').delete().in('id', idsToDelete);
      if (delErr) {
        // Fallback: Batch soft-delete if foreign key constraint (e.g. order_items) exists
        await supabase.from('variants').update({ stock_quantity: 0 }).in('id', idsToDelete);
      }
    }

    // Upsert existing and Insert new variants in batch
    const variantsToUpdate = variantsWithProductId.filter((v: any) => v.id);
    const variantsToInsert = variantsWithProductId
      .filter((v: any) => !v.id)
      .map((v: any) => ({ ...v, created_at: new Date().toISOString() }));

    if (variantsToUpdate.length > 0) {
      const { error: updateErr } = await supabase.from('variants').upsert(variantsToUpdate);
      if (updateErr) throw updateErr;
    }
    
    if (variantsToInsert.length > 0) {
      const { error: insertErr } = await supabase.from('variants').insert(variantsToInsert);
      if (insertErr) throw insertErr;
    }
  }

  // 3. Check Product Costing
  const { data: costingCheck } = await supabase
    .from('product_costings')
    .select('supplier_cost')
    .eq('product_id', productId)
    .maybeSingle();

  return apiSuccess({ 
    success: true, 
    productId, 
    costingMissing: (!costingCheck || Number(costingCheck.supplier_cost) === 0) 
  });
});
