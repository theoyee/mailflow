import { createPool, hasPostgresConfig, ensureNeonTables } from './index';
import { sqliteDb } from './sqlite';
import { licenses as sqliteLicenses } from './sqlite-schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface LicenseEntity {
  id: string | number;
  licenseKey: string;
  type: string;
  status: string;
  deviceLimit: number;
  activations: number;
  label?: string | null;
  expiresAt?: string | Date | null;
  createdAt?: string | Date | null;
}

export async function listAllLicenses(): Promise<LicenseEntity[]> {
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `SELECT id, license_key as "licenseKey", type, status, device_limit as "deviceLimit", activations, label, expires_at as "expiresAt", created_at as "createdAt"
         FROM licenses ORDER BY created_at DESC`
      );
      return res.rows;
    } catch (err) {
      console.error('[Neon] listAllLicenses error, falling back to SQLite:', err);
    }
  }

  // Fallback to SQLite
  const rows = await sqliteDb.select().from(sqliteLicenses).orderBy(desc(sqliteLicenses.createdAt));
  return rows.map((r) => ({
    id: r.id,
    licenseKey: r.licenseKey,
    type: r.type,
    status: r.status,
    deviceLimit: r.deviceLimit,
    activations: r.activations,
    label: r.label,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
  }));
}

export async function insertLicense(data: {
  licenseKey: string;
  type: string;
  status?: string;
  deviceLimit?: number;
  label?: string;
  expiresAt?: Date | null;
}): Promise<LicenseEntity> {
  const pool = createPool();
  const status = data.status || 'active';
  const deviceLimit = data.deviceLimit || 3;
  const label = data.label || null;
  const expiresAt = data.expiresAt || null;

  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `INSERT INTO licenses (license_key, type, status, device_limit, activations, label, expires_at)
         VALUES ($1, $2, $3, $4, 0, $5, $6)
         RETURNING id, license_key as "licenseKey", type, status, device_limit as "deviceLimit", activations, label, expires_at as "expiresAt", created_at as "createdAt"`,
        [data.licenseKey, data.type, status, deviceLimit, label, expiresAt]
      );
      return res.rows[0];
    } catch (err) {
      console.error('[Neon] insertLicense error, saving to SQLite:', err);
    }
  }

  // SQLite
  const id = uuidv4();
  const newRecord = {
    id,
    licenseKey: data.licenseKey,
    type: data.type,
    status,
    deviceLimit,
    activations: 0,
    label: label || undefined,
    expiresAt: expiresAt || undefined,
  };
  await sqliteDb.insert(sqliteLicenses).values(newRecord);
  return newRecord;
}

export async function findLicenseByKey(licenseKey: string): Promise<LicenseEntity | null> {
  const pool = createPool();
  const cleanKey = licenseKey.trim().toUpperCase();

  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `SELECT id, license_key as "licenseKey", type, status, device_limit as "deviceLimit", activations, label, expires_at as "expiresAt", created_at as "createdAt"
         FROM licenses WHERE UPPER(TRIM(license_key)) = $1 LIMIT 1`,
        [cleanKey]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.error('[Neon] findLicenseByKey error, falling back to SQLite:', err);
    }
  }

  const result = await sqliteDb.select().from(sqliteLicenses).where(eq(sqliteLicenses.licenseKey, cleanKey)).limit(1);
  if (result[0]) {
    const r = result[0];
    return {
      id: r.id,
      licenseKey: r.licenseKey,
      type: r.type,
      status: r.status,
      deviceLimit: r.deviceLimit,
      activations: r.activations,
      label: r.label,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    };
  }
  return null;
}

export async function updateLicenseActivations(id: string | number, newCount: number) {
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await pool.query(`UPDATE licenses SET activations = $1 WHERE id = $2`, [newCount, numId]);
      } else {
        await pool.query(`UPDATE licenses SET activations = $1 WHERE id::text = $2`, [newCount, String(id)]);
      }
      return;
    } catch (err) {
      console.error('[Neon] updateActivations error:', err);
    }
  }

  await sqliteDb.update(sqliteLicenses).set({ activations: newCount }).where(eq(sqliteLicenses.id, String(id)));
}

export async function setLicenseStatus(idOrKey: { id?: string | number; key?: string }, status: string) {
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      if (idOrKey.id && idOrKey.key) {
        const numId = Number(idOrKey.id);
        await pool.query(
          `UPDATE licenses SET status = $1 WHERE id = $2 OR UPPER(TRIM(license_key)) = $3`,
          [status, !isNaN(numId) ? numId : -1, idOrKey.key.trim().toUpperCase()]
        );
      } else if (idOrKey.id) {
        const numId = Number(idOrKey.id);
        if (!isNaN(numId)) {
          await pool.query(`UPDATE licenses SET status = $1 WHERE id = $2`, [status, numId]);
        } else {
          await pool.query(`UPDATE licenses SET status = $1 WHERE id::text = $2`, [status, String(idOrKey.id)]);
        }
      } else if (idOrKey.key) {
        await pool.query(
          `UPDATE licenses SET status = $1 WHERE UPPER(TRIM(license_key)) = $2`,
          [status, idOrKey.key.trim().toUpperCase()]
        );
      }
      return;
    } catch (err) {
      console.error('[Neon] setLicenseStatus error:', err);
    }
  }

  if (idOrKey.id) {
    await sqliteDb.update(sqliteLicenses).set({ status }).where(eq(sqliteLicenses.id, String(idOrKey.id)));
  } else if (idOrKey.key) {
    await sqliteDb.update(sqliteLicenses).set({ status }).where(eq(sqliteLicenses.licenseKey, idOrKey.key.toUpperCase()));
  }
}
