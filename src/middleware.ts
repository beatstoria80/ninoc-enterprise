import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  
  // Create base response based on i18n URL rewriting
  let response: NextResponse;
  if (pathname.startsWith('/en/') || pathname === '/en') {
    requestHeaders.set('x-next-locale', 'EN')
    const newPath = pathname === '/en' ? '/' : pathname.replace('/en', '')
    response = NextResponse.rewrite(new URL(`${newPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    })
  } else {
    requestHeaders.set('x-next-locale', 'ID')
    response = NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // Supabase SSR logic to refresh session cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // Re-create the response to apply cookie updates, keeping the rewrite logic
          if (pathname.startsWith('/en/') || pathname === '/en') {
            const newPath = pathname === '/en' ? '/' : pathname.replace('/en', '')
            response = NextResponse.rewrite(new URL(`${newPath}${search}`, request.url), {
              request: { headers: requestHeaders },
            })
          } else {
            response = NextResponse.next({
              request: { headers: requestHeaders },
            })
          }
          
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and supabase.auth.getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Check for Admin Routes Protection (Bypassed/Access opened)
  /*
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  */

  // 2. Protect Admin APIs (Bypassed/Access opened)
  /*
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/auth/admin')) {
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }
  }
  */

  // 3. User Route Protection
  if (!user && pathname.startsWith('/profile')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 4. Affiliate Tracking
  const ref = request.nextUrl.searchParams.get('ref')
  if (ref) {
    response.cookies.set('ninoc_affiliate_ref', ref, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
