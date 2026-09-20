import { NextRequest, NextResponse } from 'next/server';
import { findSmtpAccountById, insertEmail } from '@/src/db/mail-repo';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { accountId, to, subject, body } = await req.json();

    if (!accountId || !to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const account = await findSmtpAccountById(accountId);

    if (!account) {
      return NextResponse.json({ error: 'SMTP Account not found' }, { status: 404 });
    }

    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: {
        user: account.user,
        pass: `${account.password || ''}`,
      },
    });

    // Record email in DB
    const savedEmail = await insertEmail({
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

    return NextResponse.json({ success: true, emailId: savedEmail.id });
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email. Check SMTP settings.' }, { status: 500 });
  }
}
