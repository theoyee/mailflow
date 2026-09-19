import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// export const smtpAccounts = sqliteTable('smtp_accounts', {
//   id: text('id').primaryKey(),
//   name: text('name').notNull(),
//   host: text('host').notNull(),
//   port: integer('port').notNull(),
//   secure: integer('secure', { mode: 'boolean' }).notNull(),
//   user: text('user').notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
// });

export const smtpAccounts = sqliteTable('smtp_accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  host: text('host').notNull(),
  port: integer('port').notNull(),
  secure: integer('secure', { mode: 'boolean' }).notNull(),
  user: text('user').notNull(),
  password: text('password'), // <-- ADD THIS LINE
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  company: text('company'),
  position: text('position'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const emails = sqliteTable('emails', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => smtpAccounts.id),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  to: text('to').notNull(),
  cc: text('cc'),
  bcc: text('bcc'),
  status: text('status').notNull(), // draft, scheduled, sent, failed
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  threadId: text('thread_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  templateId: text('template_id'),
  status: text('status').notNull(), // active, paused, completed
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const licenses = sqliteTable('licenses', {
  id: text('id').primaryKey(),
  licenseKey: text('license_key').notNull().unique(),
  type: text('type').notNull(), // lifetime, annual, trial
  status: text('status').notNull().default('active'), // active, revoked, expired
  deviceLimit: integer('device_limit').notNull().default(3),
  activations: integer('activations').notNull().default(0),
  label: text('label'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
