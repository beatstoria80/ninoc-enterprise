import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { withErrorHandler, apiSuccess, apiBadRequest } from '@/lib/apiResponse';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { collectionId } = body;

  if (!collectionId) {
    return apiBadRequest('Collection ID is required');
  }

  const supabase = getSupabaseAdmin();

  // Delete product relations first
  await supabase
    .from('collection_products')
    .delete()
    .eq('collection_id', collectionId);

  // Delete the collection
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId);
  if (error) throw error;

  return apiSuccess({ deleted: true });
});
