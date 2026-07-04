import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { apiBadRequest, apiInternalError, apiSuccess } from '@/lib/apiResponse';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return fallback concept mall pillars
        return NextResponse.json([
          { id: '1', name: 'Apparel & Archive', slug: 'apparel', gpc_code: 'Apparel & Accessories > Clothing', sort_order: 1 },
          { id: '2', name: 'Objects & Consumer Goods', slug: 'objects', gpc_code: 'Home & Garden > Kitchen & Dining', sort_order: 2 },
          { id: '3', name: 'Pantry & Café (F&B)', slug: 'pantry', gpc_code: 'Food, Beverages & Tobacco > Beverages > Coffee', sort_order: 3 }
        ]);
      }
      return apiBadRequest(error.message);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return apiInternalError('Failed to fetch departments', err?.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, gpc_code, description, sort_order } = body;

    if (!name || !slug || !gpc_code) {
      return apiBadRequest('Name, slug, and GPC code are required');
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({
        name,
        slug,
        gpc_code,
        description: description || '',
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) {
      return apiBadRequest(error.message);
    }

    return apiSuccess({ data }, 201);
  } catch (err: any) {
    return apiInternalError('Failed to create department', err?.message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiBadRequest('ID is required');
    }

    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      return apiBadRequest(error.message);
    }

    return apiSuccess({ message: 'Department deleted successfully' });
  } catch (err: any) {
    return apiInternalError('Failed to delete department', err?.message);
  }
}
