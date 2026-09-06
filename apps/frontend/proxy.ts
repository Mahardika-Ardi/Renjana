import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'renjana_access';
const REFRESH_COOKIE = 'renjana_refresh';
const REFRESH_ENDPOINT = `${process.env.API_URL}/auth/refresh`;

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

  if (isStaticAsset) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(AUTH_COOKIE)?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      const refreshRes = await fetch(REFRESH_ENDPOINT, {
        method: 'POST',
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      });

      if (refreshRes.ok) {
        const response = NextResponse.next();
        const setCookieHeader = refreshRes.headers.get('set-cookie');
        if (setCookieHeader) {
          response.headers.set('set-cookie', setCookieHeader);
        }
        return response;
      }
    } catch {}
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
