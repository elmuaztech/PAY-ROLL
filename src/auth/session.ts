import jwt from 'jsonwebtoken';
import type { IncomingMessage, ServerResponse } from 'http';

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return 'payroll_system_secure_local_session_secret_2026';
  }
  return secret;
}

const COOKIE_NAME = 'payroll_auth_token';

export interface UserSessionPayload {
  userId: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'PAYROLL_OFFICER' | 'VIEWER';
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookieItem => {
    const parts = cookieItem.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('=').trim());
    }
  });
  return list;
}

function serializeCookie(name: string, val: string, options: { httpOnly?: boolean; secure?: boolean; sameSite?: string; path?: string; maxAge?: number; expires?: Date } = {}): string {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;
  if (options.maxAge) str += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.path) str += `; Path=${options.path}`;
  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  return str;
}

export function createSessionToken(user: { id: string; fullName: string; email: string; role: string }): string {
  const payload: UserSessionPayload = {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: (user.role || 'PAYROLL_OFFICER').toUpperCase() as any
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: '8h', algorithm: 'HS256' });
}

export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as UserSessionPayload;
  } catch (err) {
    return null;
  }
}

export function setSessionCookie(res: ServerResponse, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSerialized = serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 // 8 hours
  });

  res.setHeader('Set-Cookie', cookieSerialized);
}

export function clearSessionCookie(res: ServerResponse): void {
  const cookieSerialized = serializeCookie(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });

  res.setHeader('Set-Cookie', cookieSerialized);
}

export function getAuthSession(req: IncomingMessage): UserSessionPayload | null {
  const cookiesHeader = req.headers.cookie || '';
  const cookies = parseCookieHeader(cookiesHeader);
  const tokenFromCookie = cookies[COOKIE_NAME];

  if (tokenFromCookie) {
    const verified = verifySessionToken(tokenFromCookie);
    if (verified) return verified;
  }

  // Fallback to Bearer token header if provided
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    return verifySessionToken(bearerToken);
  }

  return null;
}
