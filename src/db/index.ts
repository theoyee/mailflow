import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

declare global {
  var _postgresPool: Pool | undefined;
}

// In-memory mock store when PostgreSQL is not configured
const inMemoryStore = {
  users: [] as any[],
  licenses: [] as any[],
  devices: [] as any[],
  userIdCounter: 1,
  licenseIdCounter: 1,
  deviceIdCounter: 1,
};

function createMockDb() {
  return {
    select: () => ({
      from: (table: any) => {
        const tableName = table?.[Symbol.for('drizzle:Name')] || table?._?.name || '';
        const getList = () => {
          if (tableName.includes('user')) return inMemoryStore.users;
          if (tableName.includes('license')) return inMemoryStore.licenses;
          if (tableName.includes('device')) return inMemoryStore.devices;
          return [];
        };
        const items = getList();
        return {
          where: (_condition: any) => ({
            limit: (n: number) => Promise.resolve(items.slice(0, n)),
            then: (resolve: any) => Promise.resolve(items).then(resolve),
          }),
          limit: (n: number) => Promise.resolve(items.slice(0, n)),
          then: (resolve: any) => Promise.resolve(items).then(resolve),
        };
      },
    }),
    insert: (table: any) => ({
      values: (val: any) => {
        const tableName = table?.[Symbol.for('drizzle:Name')] || table?._?.name || '';
        const record = { ...val };
        if (tableName.includes('user')) {
          record.id = inMemoryStore.userIdCounter++;
          record.createdAt = new Date();
          inMemoryStore.users.push(record);
        } else if (tableName.includes('license')) {
          record.id = inMemoryStore.licenseIdCounter++;
          record.createdAt = new Date();
          inMemoryStore.licenses.push(record);
        } else if (tableName.includes('device')) {
          record.id = inMemoryStore.deviceIdCounter++;
          record.createdAt = new Date();
          inMemoryStore.devices.push(record);
        }
        return {
          returning: () => Promise.resolve([record]),
          then: (resolve: any) => Promise.resolve([record]).then(resolve),
        };
      },
    }),
    query: new Proxy({}, {
      get: () => ({
        findMany: async () => [],
        findFirst: async () => null,
      }),
    }),
  } as any;
}

export const getNeonConnectionString = (): string | null => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD) {
    const dbName = process.env.SQL_DB_NAME || 'neondb';
    return `postgresql://${encodeURIComponent(process.env.SQL_USER)}:${encodeURIComponent(process.env.SQL_PASSWORD)}@${process.env.SQL_HOST}/${dbName}?sslmode=require`;
  }
  return null;
};

export const hasPostgresConfig = (): boolean => {
  return Boolean(getNeonConnectionString() || process.env.SQL_HOST || process.env.PGHOST);
};

export const createPool = () => {
  if (!global._postgresPool) {
    const connString = getNeonConnectionString();
    if (connString) {
      // Neon connection string
      global._postgresPool = new Pool({
        connectionString: connString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else if (process.env.SQL_HOST || process.env.PGHOST) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || process.env.PGHOST,
        user: process.env.SQL_USER || process.env.PGUSER,
        password: process.env.SQL_PASSWORD || process.env.PGPASSWORD,
        database: process.env.SQL_DB_NAME || process.env.PGDATABASE,
        port: Number(process.env.PGPORT) || 5432,
        max: 10,
        connectionTimeoutMillis: 15000,
        ssl: { rejectUnauthorized: false },
      });
    }

    if (global._postgresPool) {
      global._postgresPool.on('error', (err) => {
        console.error('Unexpected error on Neon/PostgreSQL pool client:', err);
      });
    }
  }
  return global._postgresPool;
};

let initializedTables = false;
export async function ensureNeonTables() {
  if (initializedTables) return;
  const pool = createPool();
  if (!pool) return;

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS licenses (
          id SERIAL PRIMARY KEY,
          license_key TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          device_limit INTEGER NOT NULL DEFAULT 3,
          activations INTEGER NOT NULL DEFAULT 0,
          label TEXT,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS smtp_accounts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          host TEXT NOT NULL,
          port INTEGER NOT NULL,
          secure BOOLEAN NOT NULL DEFAULT false,
          "user" TEXT NOT NULL,
          password TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          first_name TEXT,
          last_name TEXT,
          email TEXT NOT NULL UNIQUE,
          company TEXT,
          position TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          account_id TEXT,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          "to" TEXT NOT NULL,
          cc TEXT,
          bcc TEXT,
          status TEXT NOT NULL DEFAULT 'sent',
          scheduled_at TIMESTAMP,
          sent_at TIMESTAMP,
          thread_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS campaigns (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          template_id TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      initializedTables = true;
      console.log('[Neon PostgreSQL] Schema tables verified and ready.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[Neon PostgreSQL] Failed to ensure tables:', err);
  }
}

let db: any;

if (hasPostgresConfig()) {
  try {
    const pool = createPool();
    if (pool) {
      db = drizzle(pool, { schema });
      // Trigger table creation non-blocking
      ensureNeonTables().catch((e) => console.warn('[Neon] Init error:', e));
    } else {
      db = createMockDb();
    }
  } catch (err) {
    console.warn('[AI Studio] PostgreSQL/Neon not connected — using mock db', err);
    db = createMockDb();
  }
} else {
  db = createMockDb();
}

export { db };

