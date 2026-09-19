import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './sqlite-schema';
import path from 'path';

// For Electron, we want to store the DB in the app's userData path.
// But for development/Next.js side, we might just use a local file if running outside Electron.
// To keep it simple in AI Studio preview, we'll use a local file.
const dbPath = typeof window !== 'undefined' ? 'file:local.db' : 'file:local.db';

export const sqliteClient = createClient({
  url: dbPath,
});

export const sqliteDb = drizzle(sqliteClient, { schema });
