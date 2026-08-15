import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin UI and Admin API routes
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  
  // Exclude login and auth endpoints from protection
  const isAuthRoute = pathname === '/admin/login' || pathname.startsWith('/api/auth/admin');

  if (isAdminRoute && !isAuthRoute) {
    const adminSession = request.cookies.get('admin_session');

    // Strict validation of the admin_session cookie
    if (!adminSession || adminSession.value !== 'authenticated') {
      console.warn(`[Middleware] Blocked unauthorized access attempt to: ${pathname}`);
      
      // If it's an API route (e.g., /api/admin/orders/cancel), block with 401 JSON
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized: Secure Admin Portal Access Required' },
          { status: 401 }
        );
      }
      
      // If it's a page route (e.g., /admin), redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Optimizing the Edge matching for performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (meta files)
     * - images, media (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
