import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { licenses, users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ error: 'Email and type are required' }, { status: 400 });
    }

    // Mock auth/user creation for the demo
    let user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    
    if (!user) {
      const inserted = await db.insert(users).values({
        uid: uuidv4(),
        email,
      }).returning();
      user = inserted[0];
    }

    const licenseKey = `NEXUS-${uuidv4().toUpperCase().substring(0, 18)}`;
    
    let expiresAt = null;
    if (type === 'trial') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // 14 day trial
    } else if (type === 'monthly') {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (type === 'yearly') {
      expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const insertedLicense = await db.insert(licenses).values({
      userId: user.id,
      licenseKey,
      type,
      status: 'active',
      deviceLimit: 3,
      expiresAt,
    }).returning();

    return NextResponse.json({
      success: true,
      license: insertedLicense[0],
    });
  } catch (error: any) {
    console.error('Failed to generate license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
