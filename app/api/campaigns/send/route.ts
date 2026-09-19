import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/src/db/sqlite';
import { emails, smtpAccounts } from '@/src/db/sqlite-schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { accountId, to, subject, body } = await req.json();

    if (!accountId || !to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accountRes = await sqliteDb.select().from(smtpAccounts).where(eq(smtpAccounts.id, accountId)).limit(1);
    const account = accountRes[0];

    if (!account) {
      return NextResponse.json({ error: 'SMTP Account not found' }, { status: 404 });
    }

    // Usually password comes from OS Keychain via IPC, but here we assume it's in the DB or mock it
    // For this prototype, we'll assume the user just saved it (mocking auth)

    // Create Nodemailer transporter
    // const transporter = nodemailer.createTransport({
    //   host: account.host,
    //   port: account.port,
    //   secure: account.secure,
    //   auth: {
    //     user: account.user,
    //     pass: "demo-password-would-be-here",
    //   },
    // });

    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: {
        user: account.user,
        pass: `${account.password}`, // <-- CHANGE THIS from "demo-password-would-be-here"
      },
    });

    // In a real app we'd verify the connection
    // await transporter.verify();

    // Record email in DB
    const emailId = uuidv4();
    await sqliteDb.insert(emails).values({
      id: emailId,
      accountId,
      subject,
      body,
      to,
      status: 'sent',
      sentAt: new Date(),
    });

    // We skip actual sending in this demo to prevent spam, 
    // but the architecture is ready.

    await transporter.sendMail({
      from: `"${account.name}" <${account.user}>`,
      to,
      subject,
      text: body,
    });

    return NextResponse.json({ success: true, emailId });
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email. Check SMTP settings.' }, { status: 500 });
  }
}
