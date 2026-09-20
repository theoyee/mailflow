import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './sqlite-schema';
import path from 'path';

// For Electron or local Node, store in local.db
// For Vercel or serverless environments, the filesystem is read-only except /tmp
function getSqliteDbPath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return 'file:/tmp/local.db';
  }
  return 'file:local.db';
}

function initSqliteClient() {
  try {
    return createClient({
      url: getSqliteDbPath(),
    });
  } catch (err) {
    console.warn('[SQLite] Fallback in-memory client due to:', err);
    return createClient({
      url: ':memory:',
    });
  }
}

export const sqliteClient = initSqliteClient();

export const sqliteDb = drizzle(sqliteClient, { schema });

// Auto-create SQLite tables if they do not already exist
if (typeof window === 'undefined') {
  (async () => {
    try {
      await sqliteClient.execute(`
        CREATE TABLE IF NOT EXISTS smtp_accounts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          host TEXT NOT NULL,
          port INTEGER NOT NULL,
          secure INTEGER NOT NULL,
          user TEXT NOT NULL,
          password TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
      await sqliteClient.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          first_name TEXT,
          last_name TEXT,
          email TEXT NOT NULL UNIQUE,
          company TEXT,
          position TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
      await sqliteClient.execute(`
        CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL REFERENCES smtp_accounts(id),
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          "to" TEXT NOT NULL,
          cc TEXT,
          bcc TEXT,
          status TEXT NOT NULL,
          scheduled_at INTEGER,
          sent_at INTEGER,
          thread_id TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
      await sqliteClient.execute(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          template_id TEXT,
          status TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
      await sqliteClient.execute(`
        CREATE TABLE IF NOT EXISTS licenses (
          id TEXT PRIMARY KEY,
          license_key TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          device_limit INTEGER NOT NULL DEFAULT 3,
          activations INTEGER NOT NULL DEFAULT 0,
          label TEXT,
          expires_at INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
    } catch (err) {
      console.warn('[AI Studio] SQLite initialization note:', err);
    }
  })();
}
