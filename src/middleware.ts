import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  
  const isAuthPage = pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup');
  const isAdminRoute = pathname.startsWith('/admin');

  // Protected routes
  const protectedRoutes = ['/dashboard', '/orders', '/profile', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Handle auth pages - redirect logged in users to dashboard
  if (isAuthPage) {
    if (token) {
      // Always redirect to user dashboard - admin access via secret button
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check admin role for admin routes
    if (isAdminRoute && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
};
