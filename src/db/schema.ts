import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // optional / null for standalone
  licenseKey: text('license_key').notNull().unique(),
  type: text('type').notNull(), // trial, annual, lifetime
  status: text('status').notNull().default('active'), // active, inactive, revoked, expired
  deviceLimit: integer('device_limit').notNull().default(3),
  activations: integer('activations').notNull().default(0),
  label: text('label'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  licenseId: integer('license_id').references(() => licenses.id).notNull(),
  deviceId: text('device_id').notNull(), // HWID
  deviceName: text('device_name'),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  licenses: many(licenses),
}));

export const licensesRelations = relations(licenses, ({ one, many }) => ({
  owner: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  devices: many(devices),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  license: one(licenses, {
    fields: [devices.licenseId],
    references: [licenses.id],
  }),
}));

