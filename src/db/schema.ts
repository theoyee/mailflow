import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  licenseKey: text('license_key').notNull().unique(),
  type: text('type').notNull(), // trial, monthly, yearly, lifetime
  status: text('status').notNull(), // active, inactive, expired, suspended
  deviceLimit: integer('device_limit').notNull().default(1),
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
