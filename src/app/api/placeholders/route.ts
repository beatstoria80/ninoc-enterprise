import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('placeholder_configs')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('sort_order');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ placeholders: data });
  } catch (err) {
    console.error('[GET /api/placeholders]', err);
    return NextResponse.json({ error: 'Failed to fetch placeholders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Admin-only: get service role or use anon key for now
    const body = await req.json();
    const { label, content, category, sort_order } = body;

    if (!label || !content) {
      return NextResponse.json({ error: 'label and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('placeholder_configs')
      .insert({
        label,
        content,
        category: category || 'general',
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ placeholder: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/placeholders]', err);
    return NextResponse.json({ error: 'Failed to create placeholder' }, { status: 500 });
  }
}