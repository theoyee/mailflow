import { NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin-auth';
import { hasPostgresConfig, getNeonConnectionString, createPool, ensureNeonTables } from '@/src/db';

export async function GET(req: Request) {
  const session = await checkAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const isConfigured = hasPostgresConfig();
  const connString = getNeonConnectionString();
  let dbStatus = 'sqlite_fallback';
  let latencyMs: number | null = null;
  let hostDisplay = 'Local SQLite Database';

  if (isConfigured) {
    const start = Date.now();
    try {
      const pool = createPool();
      if (pool) {
        await ensureNeonTables();
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
          latencyMs = Date.now() - start;
          dbStatus = 'neon_connected';

          if (connString) {
            try {
              const url = new URL(connString.replace(/^postgresql:\/\//, 'http://'));
              hostDisplay = url.hostname;
            } catch {
              hostDisplay = 'Neon Cloud PostgreSQL';
            }
          } else if (process.env.SQL_HOST) {
            hostDisplay = process.env.SQL_HOST;
          }
        } finally {
          client.release();
        }
      }
    } catch (err: any) {
      console.warn('Neon connection check error:', err.message);
      dbStatus = 'connection_error';
      hostDisplay = err.message || 'Connection failed';
    }
  }

  return NextResponse.json({
    authenticated: true,
    username: session.username,
    database: {
      status: dbStatus,
      isNeon: isConfigured,
      host: hostDisplay,
      latencyMs,
    },
  });
}
