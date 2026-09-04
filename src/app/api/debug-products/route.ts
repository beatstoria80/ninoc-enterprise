import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    
    // Check connection and fetch products with exact join
    const { data: products, error } = await supabase
      .from('products')
      .select('*, variants(*), suppliers(name)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message, details: error });
    }

    return NextResponse.json({ 
      success: true, 
      count: products?.length || 0,
      sample: products 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
