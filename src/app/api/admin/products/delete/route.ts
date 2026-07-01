import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Delete variants first
    const { error: variantError } = await adminClient
      .from('variants')
      .delete()
      .eq('product_id', id);

    if (variantError) throw variantError;

    // 2. Delete the product
    const { error: productError } = await adminClient
      .from('products')
      .delete()
      .eq('id', id);

    if (productError) {
      // If there is a foreign key constraint, like order_items
      if (productError.code === '23503') {
         return NextResponse.json({ error: 'Cannot delete product because it has associated orders.' }, { status: 400 });
      }
      throw productError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Delete Product Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
