import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { label, content, category, sort_order, is_active } = body;

    const { data, error } = await supabase
      .from('placeholder_configs')
      .update({
        ...(label !== undefined && { label }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(sort_order !== undefined && { sort_order }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ placeholder: data });
  } catch (err) {
    console.error('[PATCH /api/placeholders/[id]]', err);
    return NextResponse.json({ error: 'Failed to update placeholder' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('placeholder_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/placeholders/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete placeholder' }, { status: 500 });
  }
}
