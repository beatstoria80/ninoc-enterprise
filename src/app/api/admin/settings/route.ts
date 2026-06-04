import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('atelier_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[api/admin/settings] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      const { data, error } = await supabaseAdmin
        .from('atelier_settings')
        .select('*');
      if (error) throw error;
      return NextResponse.json({ data });
    }

    const { data, error } = await supabaseAdmin
      .from('atelier_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[api/admin/settings] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}