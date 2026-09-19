import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { licenses, devices } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, deviceName } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    const result = await db.select().from(licenses).where(eq(licenses.licenseKey, licenseKey)).limit(1);
    const license = result[0];

    if (!license) {
      return NextResponse.json({ error: 'Invalid license key' }, { status: 404 });
    }

    if (license.status !== 'active') {
      return NextResponse.json({ error: `License is ${license.status}` }, { status: 403 });
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'License has expired' }, { status: 403 });
    }

    // Check device limits
    const existingDevices = await db.select().from(devices).where(eq(devices.licenseId, license.id));

    // We can use a stable HWID from the client, but for simplicity here we generate one
    const deviceId = uuidv4();

    if (existingDevices.length >= license.deviceLimit) {
      return NextResponse.json({ error: 'Device limit reached for this license' }, { status: 403 });
    }

    // Register device
    await db.insert(devices).values({
      licenseId: license.id,
      deviceId,
      deviceName: deviceName || 'Unknown Device',
    });

    return NextResponse.json({
      success: true,
      deviceId,
      license: {
        type: license.type,
        expiresAt: license.expiresAt,
      }
    });
  } catch (error: any) {
    console.error('Failed to activate license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
