import { Response } from 'express';
import { AuthTokens } from '@renjana/types';

export const ACCESS_TOKEN_COOKIE = 'renjana_access';
export const REFRESH_TOKEN_COOKIE = 'renjana_refresh';

export interface CookieOptions {
  secure: boolean;
  sameSite: boolean | 'lax' | 'strict' | 'none';
}

export function cookieOptions(): CookieOptions {
  return {
    secure:
      process.env.COOKIE_SECURE === 'true' ||
      process.env.NODE_ENV === 'production',
    sameSite:
      (process.env.COOKIE_SAMESITE as CookieOptions['sameSite']) ||
      (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  };
}

const baseCookie = (opts: CookieOptions, maxAge: number, path: string) => ({
  httpOnly: true,
  secure: opts.secure,
  sameSite: opts.sameSite,
  maxAge,
  path,
});

export function setAuthCookies(
  res: Response,
  tokens: AuthTokens,
  opts: CookieOptions,
) {
  res.cookie(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    baseCookie(opts, 15 * 60 * 1000, '/'),
  );
  res.cookie(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    baseCookie(opts, 7 * 24 * 60 * 60 * 1000, '/api/v1/auth'),
  );
}

export function clearAuthCookies(res: Response, opts: CookieOptions) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: '/',
  });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: '/api/v1/auth',
  });
}
