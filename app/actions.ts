"use server";

import { sqliteDb } from '@/src/db/sqlite';
import { smtpAccounts, contacts, campaigns } from '@/src/db/sqlite-schema';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function addSmtpAccount(data: { name: string; host: string; port: number; secure: boolean; user: string; pass: string }) {
  const id = uuidv4();

  // In a real desktop app, we would use IPC to save the password securely to OS Keychain
  // For the demo, we are omitting the password column from plain-text SQLite.
  // We'll store a placeholder or just assume IPC handles it.

  // await sqliteDb.insert(smtpAccounts).values({
  //   id,
  //   name: data.name,
  //   host: data.host,
  //   port: data.port,
  //   secure: data.secure,
  //   user: data.user,
  // });


  await sqliteDb.insert(smtpAccounts).values({
    id,
    name: data.name,
    host: data.host,
    port: data.port,
    secure: data.secure,
    user: data.user,
    password: data.pass, // <-- ADD THIS LINE
  });

  revalidatePath('/settings/smtp');
  return { success: true };
}

export async function getSmtpAccounts() {
  return await sqliteDb.select().from(smtpAccounts);
}

export async function addContact(data: { firstName: string; lastName: string; email: string; company?: string; position?: string }) {
  await sqliteDb.insert(contacts).values({
    id: uuidv4(),
    ...data,
  });
  revalidatePath('/contacts');
  return { success: true };
}

export async function getContacts() {
  return await sqliteDb.select().from(contacts);
}
