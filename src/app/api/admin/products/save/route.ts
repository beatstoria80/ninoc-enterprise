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

  // Normalize category against Postgres enum main_category_type ('pakaian', 'aksesoris', 'utilities')
  // while preserving specific sub-category selections (e.g. 'apparel', 'footwear', 'coffee', 'pakaian-pria', 'unisex', 'pakaian-unisex')
  if (productData && productData.category) {
    const rawCat = String(productData.category).toLowerCase().trim();
    const validEnums = ['pakaian', 'aksesoris', 'utilities'];
    if (!validEnums.includes(rawCat)) {
      if (!productData.sub_category) {
        productData.sub_category = productData.category;
      }
      if (rawCat.includes('aksesoris') || rawCat.includes('accessor') || rawCat.includes('accesories') || rawCat.includes('topi') || rawCat.includes('tas') || rawCat.includes('bag') || rawCat.includes('hat') || rawCat.includes('jewelry') || rawCat.includes('kalung') || rawCat.includes('gelang')) {
        productData.category = 'aksesoris';
      } else if (rawCat.includes('utilities') || rawCat.includes('object') || rawCat.includes('home') || rawCat.includes('kitchen') || rawCat.includes('collect') || rawCat.includes('ceramic') || rawCat.includes('art') || rawCat.includes('goods') || rawCat.includes('stationery') || rawCat.includes('alat_tulis') || rawCat.includes('keramik') || rawCat.includes('rumahtangga') || rawCat.includes('coffee') || rawCat.includes('kopi') || rawCat.includes('pastry') || rawCat.includes('snack') || rawCat.includes('rtd') || rawCat.includes('fnb') || rawCat.includes('beverage') || rawCat.includes('pantry') || rawCat.includes('food') || rawCat.includes('minuman') || rawCat.includes('makanan') || rawCat.includes('roastery') || rawCat.includes('cafe')) {
        productData.category = 'utilities';
      } else {
        productData.category = 'pakaian';
      }
    }
  }

  // Normalize sub_category for 'unisex' consistency and extract from specifications if needed
  if (productData) {
    if ((!productData.sub_category || productData.sub_category === 'pakaian' || productData.sub_category === 'atasan' || productData.sub_category === 'bawahan') && Array.isArray(productData.specifications)) {
      const specJenis = productData.specifications.find((s: any) => s.label === 'Jenis Pakaian' || s.label === 'Sub Category');
      if (specJenis && specJenis.value && specJenis.value !== 'pakaian') {
        productData.sub_category = String(specJenis.value).toLowerCase().replace(/\s+/g, '-');
      }
    }
    if (productData.sub_category) {
      const rawSubCat = String(productData.sub_category).toLowerCase().trim();
      if (rawSubCat === 'pakaian-unisex' || rawSubCat === 'baju-unisex' || rawSubCat === 'pakaian unisex') {
        productData.sub_category = 'unisex';
      }
    }
  }

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
    const variantsWithProductId = allVariants.map((v: any) => {
      let sku = v.sku;
      if (!sku || typeof sku !== 'string' || sku.trim() === '') {
        const prodName = productData?.name || 'PROD';
        const cat = productData?.category || 'APP';
        const catCode = cat === 'celana' ? 'CLN' : cat === 'pakaian' ? 'KAS' : cat.substring(0, 3).toUpperCase();
        const baseName = prodName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
        let hash = 0;
        for (let i = 0; i < prodName.length; i++) {
          hash = prodName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const uniqueNum = Math.abs(hash % 900) + 100;
        const nameCode = `${baseName}${uniqueNum}`;
        const colorCode = (v.color || 'NON').substring(0, 3).toUpperCase();
        const sizeCode = (v.size || 'OS').toUpperCase();
        sku = `${catCode}-${nameCode}-${colorCode}-${sizeCode}`;
      }
      return { ...v, sku: sku.trim(), product_id: productId };
    });

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
