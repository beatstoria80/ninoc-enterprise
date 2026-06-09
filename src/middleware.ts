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

  // If path starts with /en/ or is exactly /en, rewrite it to root
  // The browser URL remains /en/... for SEO
  if (pathname.startsWith('/en/') || pathname === '/en') {
    requestHeaders.set('x-next-locale', 'EN')
    const newPath = pathname === '/en' ? '/' : pathname.replace('/en', '')
    return NextResponse.rewrite(new URL(`${newPath}${search}`, request.url), {
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Default (Indonesian) passes through normally
  requestHeaders.set('x-next-locale', 'ID')
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}
