// Server-only. Reads/writes the auth cookie.
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';
import { signJwt, verifyJwt, type JwtPayload } from './jwt';

const COOKIE_NAME = 'auth_token';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function setAuthCookie(payload: JwtPayload): void {
  const token = signJwt(payload, '7d');
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(): void {
  deleteCookie(COOKIE_NAME, { path: '/' });
}

export function readAuthCookie(): JwtPayload | null {
  const token = getCookie(COOKIE_NAME);
  if (!token) return null;
  return verifyJwt(token);
}
