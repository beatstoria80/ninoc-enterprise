import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { withErrorHandler, apiSuccess, apiBadRequest } from '@/lib/apiResponse';
import { createClient } from '@/utils/supabase/server';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const supabaseServer = await createClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
  if (authError || !user) throw new Error('UNAUTHORIZED');

  const body = await req.json();
  const { collectionId, payload, selectedProductIds } = body;

  if (!payload || !payload.name) {
    return apiBadRequest('Collection name is required');
  }

  const supabase = getSupabaseAdmin();
  let savedCollectionId = collectionId;

  if (savedCollectionId) {
    // Update existing collection
    const { error: updateError } = await supabase
      .from('collections')
      .update(payload)
      .eq('id', savedCollectionId);
    if (updateError) throw updateError;

    // Delete old product relations
    const { error: deleteRelError } = await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', savedCollectionId);
    if (deleteRelError) throw deleteRelError;
  } else {
    // Create new collection
    const { data, error } = await supabase
      .from('collections')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    savedCollectionId = data.id;
  }

  // Insert new product relations
  if (savedCollectionId && selectedProductIds && selectedProductIds.length > 0) {
    const relations = selectedProductIds.map((pid: string) => ({
      collection_id: savedCollectionId,
      product_id: pid,
    }));
    const { error: insertRelError } = await supabase
      .from('collection_products')
      .insert(relations);
    if (insertRelError) throw insertRelError;
  }

  return apiSuccess({ id: savedCollectionId });
});
