import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data, error } = await adminClient
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
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, gpc_code, description, sort_order } = body;

    if (!name || !slug || !gpc_code) {
      return NextResponse.json({ error: 'Name, slug, and GPC code are required' }, { status: 400 });
    }

    const { data, error } = await adminClient
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
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
