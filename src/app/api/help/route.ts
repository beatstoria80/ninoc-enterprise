import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Public endpoint — reads from atelier_settings with RLS (no service role needed)
export async function GET(req: NextRequest) {
  try {
    const keys = [
      'help_guide_customer_care',
      'help_guide_payment',
      'help_guide_return',
      'help_guide_shipping',
      'help_guide_how_to_order',
      'help_guide_how_to_track',
      'help_guide_terms',
      'help_guide_privacy',
      'store_name',
      'store_tagline',
    ];

    const { data, error } = await supabase
      .from('atelier_settings')
      .select('key, value')
      .in('key', keys);

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('[api/help] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}