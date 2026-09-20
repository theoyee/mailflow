import { createPool, hasPostgresConfig, ensureNeonTables } from './index';
import { sqliteDb } from './sqlite';
import { emails as sqliteEmails, contacts as sqliteContacts, smtpAccounts as sqliteSmtp, campaigns as sqliteCampaigns } from './sqlite-schema';
import { desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface EmailEntity {
  id: string;
  accountId?: string | null;
  subject: string;
  body: string;
  to: string;
  cc?: string | null;
  bcc?: string | null;
  status: string;
  scheduledAt?: string | Date | null;
  sentAt?: string | Date | null;
  threadId?: string | null;
  createdAt?: string | Date | null;
}

export interface ContactEntity {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  company?: string | null;
  position?: string | null;
  createdAt?: string | Date | null;
}

export interface SmtpAccountEntity {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string | null;
  createdAt?: string | Date | null;
}

export interface CampaignEntity {
  id: string;
  name: string;
  templateId?: string | null;
  status: string;
  createdAt?: string | Date | null;
}

// ----------------- EMAILS -----------------

export async function listAllEmails(): Promise<EmailEntity[]> {
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `SELECT id, account_id as "accountId", subject, body, "to", cc, bcc, status,
                scheduled_at as "scheduledAt", sent_at as "sentAt", thread_id as "threadId", created_at as "createdAt"
         FROM emails ORDER BY created_at DESC`
      );
      return res.rows;
    } catch (err) {
      console.warn('[Neon] listAllEmails failed, falling back to SQLite:', err);
    }
  }

  try {
    const rows = await sqliteDb.select().from(sqliteEmails).orderBy(desc(sqliteEmails.createdAt));
    return rows.map((r) => ({
      id: r.id,
      accountId: r.accountId,
      subject: r.subject,
      body: r.body,
      to: r.to,
      cc: r.cc,
      bcc: r.bcc,
      status: r.status,
      scheduledAt: r.scheduledAt,
      sentAt: r.sentAt,
      threadId: r.threadId,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error('[SQLite] listAllEmails failed:', err);
    return [];
  }
}

export async function insertEmail(data: {
  accountId?: string;
  subject: string;
  body: string;
  to: string;
  cc?: string;
  bcc?: string;
  status?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  threadId?: string;
}): Promise<EmailEntity> {
  const id = uuidv4();
  const pool = createPool();

  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `INSERT INTO emails (id, account_id, subject, body, "to", cc, bcc, status, scheduled_at, sent_at, thread_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING id, account_id as "accountId", subject, body, "to", cc, bcc, status, scheduled_at as "scheduledAt", sent_at as "sentAt", thread_id as "threadId", created_at as "createdAt"`,
        [
          id,
          data.accountId || null,
          data.subject,
          data.body,
          data.to,
          data.cc || null,
          data.bcc || null,
          data.status || 'sent',
          data.scheduledAt || null,
          data.sentAt || new Date(),
          data.threadId || null,
        ]
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[Neon] insertEmail failed, falling back to SQLite:', err);
    }
  }

  try {
    await sqliteDb.insert(sqliteEmails).values({
      id,
      accountId: data.accountId || 'default',
      subject: data.subject,
      body: data.body,
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      status: data.status || 'sent',
      scheduledAt: data.scheduledAt,
      sentAt: data.sentAt || new Date(),
      threadId: data.threadId,
    });
  } catch (err) {
    console.warn('[SQLite] insertEmail warning:', err);
  }

  return {
    id,
    ...data,
    status: data.status || 'sent',
    createdAt: new Date(),
  };
}

// ----------------- CONTACTS -----------------

export async function listAllContacts(): Promise<ContactEntity[]> {
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `SELECT id, first_name as "firstName", last_name as "lastName", email, company, position, created_at as "createdAt"
         FROM contacts ORDER BY created_at DESC`
      );
      return res.rows;
    } catch (err) {
      console.warn('[Neon] listAllContacts failed, falling back to SQLite:', err);
    }
  }

  try {
    const rows = await sqliteDb.select().from(sqliteContacts).orderBy(desc(sqliteContacts.createdAt));
    return rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      company: r.company,
      position: r.position,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error('[SQLite] listAllContacts failed:', err);
    return [];
  }
}

export async function insertContact(data: {
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  position?: string;
}): Promise<ContactEntity> {
  const id = uuidv4();
  const pool = createPool();

  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `INSERT INTO contacts (id, first_name, last_name, email, company, position, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, company = EXCLUDED.company, position = EXCLUDED.position
         RETURNING id, first_name as "firstName", last_name as "lastName", email, company, position, created_at as "createdAt"`,
        [id, data.firstName || null, data.lastName || null, data.email, data.company || null, data.position || null]
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[Neon] insertContact failed, falling back to SQLite:', err);
    }
  }

  try {
    await sqliteDb.insert(sqliteContacts).values({
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      company: data.company,
      position: data.position,
    });
  } catch (err) {
    console.warn('[SQLite] insertContact warning:', err);
  }

  return {
    id,
    ...data,
    createdAt: new Date(),
  };
}

// ----------------- SMTP ACCOUNTS -----------------

export async function listAllSmtpAccounts(): Promise<SmtpAccountEntity[]> {
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `SELECT id, name, host, port, secure, "user", password, created_at as "createdAt"
         FROM smtp_accounts ORDER BY created_at DESC`
      );
      return res.rows;
    } catch (err) {
      console.warn('[Neon] listAllSmtpAccounts failed, falling back to SQLite:', err);
    }
  }

  try {
    const rows = await sqliteDb.select().from(sqliteSmtp).orderBy(desc(sqliteSmtp.createdAt));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      host: r.host,
      port: r.port,
      secure: Boolean(r.secure),
      user: r.user,
      password: r.password,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error('[SQLite] listAllSmtpAccounts failed:', err);
    return [];
  }
}

export async function findSmtpAccountById(id: string): Promise<SmtpAccountEntity | null> {
  const pool = createPool();
  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `SELECT id, name, host, port, secure, "user", password, created_at as "createdAt"
         FROM smtp_accounts WHERE id = $1 LIMIT 1`,
        [id]
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[Neon] findSmtpAccountById failed, falling back to SQLite:', err);
    }
  }

  try {
    const rows = await sqliteDb.select().from(sqliteSmtp).where(eq(sqliteSmtp.id, id)).limit(1);
    if (rows[0]) {
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        host: r.host,
        port: r.port,
        secure: Boolean(r.secure),
        user: r.user,
        password: r.password,
        createdAt: r.createdAt,
      };
    }
  } catch (err) {
    console.error('[SQLite] findSmtpAccountById failed:', err);
  }

  return null;
}

export async function insertSmtpAccount(data: {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
}): Promise<SmtpAccountEntity> {
  const id = uuidv4();
  const pool = createPool();

  if (hasPostgresConfig() && pool) {
    try {
      await ensureNeonTables();
      const res = await pool.query(
        `INSERT INTO smtp_accounts (id, name, host, port, secure, "user", password, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, name, host, port, secure, "user", password, created_at as "createdAt"`,
        [id, data.name, data.host, data.port, data.secure, data.user, data.password || null]
      );
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[Neon] insertSmtpAccount failed, falling back to SQLite:', err);
    }
  }

  try {
    await sqliteDb.insert(sqliteSmtp).values({
      id,
      name: data.name,
      host: data.host,
      port: data.port,
      secure: data.secure,
      user: data.user,
      password: data.password,
    });
  } catch (err) {
    console.warn('[SQLite] insertSmtpAccount warning:', err);
  }

  return {
    id,
    ...data,
    createdAt: new Date(),
  };
}
