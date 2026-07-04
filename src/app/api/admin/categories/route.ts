import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { withErrorHandler, apiSuccess, apiBadRequest } from '@/lib/apiResponse';

export const GET = withErrorHandler(async () => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json([]);
    }
    throw error;
  }

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { name, slug, seo_keywords, seo_title_template, parent_id } = body;

  if (!name || !slug) {
    return apiBadRequest('Name and slug are required');
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      slug,
      seo_keywords: seo_keywords || [],
      seo_title_template: seo_title_template || '{name} | NINOC',
      parent_id: parent_id || null
    })
    .select()
    .single();

  if (error) throw error;
  return NextResponse.json(data);
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { id, name, slug, seo_keywords, seo_title_template, parent_id } = body;

  if (!id || !name || !slug) {
    return apiBadRequest('ID, name, and slug are required');
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .update({
      name,
      slug,
      seo_keywords,
      seo_title_template,
      parent_id: parent_id || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return NextResponse.json(data);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return apiBadRequest('ID is required');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return apiSuccess({ success: true });
});
