import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');

  if (!ref) {
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 });
  }

  try {
    // Lookup affiliate ID based on ref code
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('code', ref.toUpperCase())
      .single();

    if (affiliate) {
      // Get client IP address
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ip = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

      // Insert click
      await supabase.from('affiliate_clicks').insert({
        affiliate_id: affiliate.id,
        ip_address: ip
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently fail to not block client
    console.error('Track error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
