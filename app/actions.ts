"use server";

import {
  insertSmtpAccount,
  listAllSmtpAccounts,
  insertContact,
  listAllContacts,
} from '@/src/db/mail-repo';
import { revalidatePath } from 'next/cache';

export async function addSmtpAccount(data: { name: string; host: string; port: number; secure: boolean; user: string; pass: string }) {
  await insertSmtpAccount({
    name: data.name,
    host: data.host,
    port: data.port,
    secure: data.secure,
    user: data.user,
    password: data.pass,
  });

  revalidatePath('/settings/smtp');
  return { success: true };
}

export async function getSmtpAccounts() {
  try {
    return await listAllSmtpAccounts();
  } catch (err) {
    console.error('Failed to get SMTP accounts:', err);
    return [];
  }
}

export async function addContact(data: { firstName: string; lastName: string; email: string; company?: string; position?: string }) {
  await insertContact({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    company: data.company,
    position: data.position,
  });

  revalidatePath('/contacts');
  return { success: true };
}

export async function getContacts() {
  try {
    return await listAllContacts();
  } catch (err) {
    console.error('Failed to get contacts:', err);
    return [];
  }
}
