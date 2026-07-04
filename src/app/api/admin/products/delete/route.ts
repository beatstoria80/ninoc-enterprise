import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { withErrorHandler, apiSuccess, apiBadRequest } from '@/lib/apiResponse';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { id } = await req.json();

  if (!id) {
    return apiBadRequest('Product ID is required');
  }

  const supabase = getSupabaseAdmin();

  // 1. Delete variants first
  const { error: variantError } = await supabase
    .from('variants')
    .delete()
    .eq('product_id', id);

  if (variantError) throw variantError;

  // 2. Delete the product
  const { error: productError } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (productError) {
    // Handle foreign key constraint (e.g. associated order_items)
    if (productError.code === '23503') {
      return apiBadRequest('Cannot delete product because it has associated orders or history.');
    }
    throw productError;
  }

  return apiSuccess({ success: true });
});
