import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  
  // Exclude static files, api, _next, and admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  let response;

  // If path starts with /en/ or is exactly /en, rewrite it to root
  // The browser URL remains /en/... for SEO
  if (pathname.startsWith('/en/') || pathname === '/en') {
    requestHeaders.set('x-next-locale', 'EN')
    const newPath = pathname === '/en' ? '/' : pathname.replace('/en', '')
    response = NextResponse.rewrite(new URL(`${newPath}${search}`, request.url), {
      request: {
        headers: requestHeaders,
      },
    })
  } else {
    // Default (Indonesian) passes through normally
    requestHeaders.set('x-next-locale', 'ID')
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Check for affiliate ref
  const ref = request.nextUrl.searchParams.get('ref')
  if (ref) {
    response.cookies.set('ninoc_affiliate_ref', ref, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true, // We will read this in the server-side API
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  return response
}
