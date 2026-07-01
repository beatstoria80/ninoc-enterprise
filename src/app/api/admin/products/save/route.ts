import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isEditMode, editingProductId, productData, allVariants } = body;

    let productId = editingProductId;

    // 1. Insert or Update Product
    if (isEditMode && productId) {
      const { data, error } = await adminClient
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();
      if (error) throw error;
    } else {
      const { data, error } = await adminClient
        .from('products')
        .insert({ ...productData, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      productId = data.id;
    }

    // 2. Handle Variants
    if (productId && allVariants && Array.isArray(allVariants)) {
      // Add productId to all variants
      const variantsWithProductId = allVariants.map((v: any) => ({ ...v, product_id: productId }));

      // Fetch existing variants to figure out what to delete
      const { data: existingVariants } = await adminClient
        .from('variants')
        .select('id')
        .eq('product_id', productId);
        
      const newVariantIds = variantsWithProductId.map((v: any) => v.id).filter(Boolean);
      const variantsToDelete = existingVariants?.filter((ev: any) => !newVariantIds.includes(ev.id)) || [];

      // Safely delete or soft-delete (stock = 0)
      for (const ev of variantsToDelete) {
        const { error: delErr } = await adminClient.from('variants').delete().eq('id', ev.id);
        if (delErr) {
          await adminClient.from('variants').update({ stock_quantity: 0 }).eq('id', ev.id);
        }
      }

      // Upsert and Insert
      const variantsToUpdate = variantsWithProductId.filter((v: any) => v.id);
      const variantsToInsert = variantsWithProductId.filter((v: any) => !v.id).map((v: any) => ({ ...v, created_at: new Date().toISOString() }));

      if (variantsToUpdate.length > 0) {
        const { error: updateErr } = await adminClient.from('variants').upsert(variantsToUpdate);
        if (updateErr) throw updateErr;
      }
      
      if (variantsToInsert.length > 0) {
        const { error: insertErr } = await adminClient.from('variants').insert(variantsToInsert);
        if (insertErr) throw insertErr;
      }
    }

    // 3. Check Costing
    const { data: costingCheck } = await adminClient
      .from('product_costings')
      .select('supplier_cost')
      .eq('product_id', productId)
      .maybeSingle();

    return NextResponse.json({ 
      success: true, 
      productId, 
      costingMissing: (!costingCheck || Number(costingCheck.supplier_cost) === 0) 
    });

  } catch (err: any) {
    console.error('API Save Product Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
