import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  // Validate origin against configured site URL to prevent redirect exploits
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || origin;
  if (origin !== allowedOrigin) {
    return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 });
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[Auth Callback] Session exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  }

  // Redirect to onboarding form (it will auto-redirect to profile if already completed)
  return NextResponse.redirect(`${origin}/onboarding`);
}
