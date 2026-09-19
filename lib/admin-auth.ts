import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createPool, hasPostgresConfig, ensureNeonTables } from '@/src/db';

const COOKIE_NAME = 'mailflow_admin_token';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'mailflow_admin_super_secret_fallback_key_2026'
  );
}

export function getDefaultAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };
}

export function createToken(username: string): string {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const secret = getSecretKey();
  const signature = createHash('sha256')
    .update(`${username}:${expires}:${secret}`)
    .digest('hex');
  return `${username}.${expires}.${signature}`;
}

export function verifyToken(token: string): { valid: boolean; username?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const [username, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr, 10);

    if (isNaN(expires) || Date.now() > expires) {
      return { valid: false };
    }

    const secret = getSecretKey();
    const expectedSignature = createHash('sha256')
      .update(`${username}:${expires}:${secret}`)
      .digest('hex');

    if (signature === expectedSignature) {
      return { valid: true, username };
    }
  } catch (err) {
    console.error('Token verification error:', err);
  }
  return { valid: false };
}

export async function validateAdminCredentials(username: string, pass: string): Promise<boolean> {
  const cleanUser = username.trim();
  const cleanPass = pass.trim();

  // 1. Check environment variable config (Primary)
  const defaultAdmin = getDefaultAdminCredentials();
  if (
    cleanUser.toLowerCase() === defaultAdmin.username.toLowerCase() &&
    cleanPass === defaultAdmin.password
  ) {
    return true;
  }

  // Also check if admin just supplied the ADMIN_PASSWORD directly
  if (process.env.ADMIN_PASSWORD && cleanPass === process.env.ADMIN_PASSWORD.trim()) {
    return true;
  }

  // 2. Check Neon database admins table if configured
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `SELECT username, password_hash FROM admins WHERE LOWER(username) = $1 LIMIT 1`,
        [cleanUser.toLowerCase()]
      );
      if (res.rows.length > 0) {
        const adminRow = res.rows[0];
        // Check hash or plain text for initial seed
        const inputHash = createHash('sha256').update(cleanPass).digest('hex');
        if (adminRow.password_hash === inputHash || adminRow.password_hash === cleanPass) {
          return true;
        }
      }
    } catch (e) {
      console.warn('[Neon Admin Auth] Neon table check error:', e);
    }
  }

  return false;
}

export async function checkAdminSession(req?: NextRequest): Promise<{ authenticated: boolean; username?: string }> {
  // Check header or cookie from request
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) {
    return { authenticated: false };
  }

  const result = verifyToken(token);
  return { authenticated: result.valid, username: result.username };
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;
