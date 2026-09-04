import { NextResponse } from 'next/server';
import { createClient as createRawClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({ success: false, error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createRawClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) => {
          return fetch(url.toString(), { ...options, cache: 'no-store', next: { revalidate: 0 } });
        }
      }
    });

    const { data: prodWithSuppliers, error: prodError } = await supabase
      .from('products')
      .select('*, variants(*), suppliers(name)')
      .order('created_at', { ascending: false });

    if (prodError) {
      console.warn('[Admin] suppliers join failed (likely RLS), falling back without suppliers:', prodError.message);
      const { data: prodFallback, error: fallbackError } = await supabase
        .from('products')
        .select('*, variants(*)')
        .order('created_at', { ascending: false });

      if (fallbackError) {
        return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: prodFallback || [] });
    }

    return NextResponse.json({ success: true, data: prodWithSuppliers || [] });
  } catch (error: any) {
    console.error('API /admin/products error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
