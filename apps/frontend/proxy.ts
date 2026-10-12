import { NextRequest, NextResponse } from 'next/server';
import { refreshTokenOnServer } from '@/lib/api/refresh-token';

const AUTH_COOKIE = 'renjana_access';
const REFRESH_COOKIE = 'renjana_refresh';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset =
    pathname.startsWith('/_next/') || pathname.includes('.');
  if (isStaticAsset) return NextResponse.next();

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isPublicRoute) return NextResponse.next();

  const accessToken = request.cookies.get(AUTH_COOKIE)?.value;
  if (accessToken) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    const setCookies = await refreshTokenOnServer(
      request.headers.get('cookie') ?? '',
    );

    if (setCookies) {
      const response = NextResponse.next();
      for (const cookie of setCookies) {
        response.headers.append('set-cookie', cookie);
      }
      return response;
    }
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
