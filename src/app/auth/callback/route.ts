import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[Auth Callback] Session exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  }

  let finalNext = requestUrl.searchParams.get('next');

  // Smart Routing Logic based on Session Data
  if (!finalNext && code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {}
        }
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      if (user.email === 'admin@ninoc.store') {
        finalNext = '/admin';
      } else if (user.email.endsWith('@ninoc.store')) {
        finalNext = '/supplier';
      }
    }
  }

  // Support dynamic redirect via 'next' query param (useful for password resets)
  const fallbackNext = finalNext || '/onboarding';
  const redirectUrl = fallbackNext.startsWith('/') ? `${origin}${fallbackNext}` : `${origin}/onboarding`;

  return NextResponse.redirect(redirectUrl);
}
