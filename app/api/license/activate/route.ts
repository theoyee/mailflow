import { NextRequest, NextResponse } from 'next/server';
import { findLicenseByKey, updateLicenseActivations } from '@/src/db/licenses-repo';
import { v4 as uuidv4 } from 'uuid';

// GET /api/license/activate?key=...: Verify license status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawKey = searchParams.get('key');
    if (!rawKey) {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    const license = await findLicenseByKey(rawKey);

    if (!license) {
      return NextResponse.json({ valid: false, error: 'Invalid license key' }, { status: 404 });
    }

    if (license.status !== 'active') {
      return NextResponse.json({ valid: false, error: `License is ${license.status}` }, { status: 403 });
    }

    if (license.expiresAt && new Date(license.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ valid: false, error: 'License has expired' }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      license: {
        licenseKey: license.licenseKey,
        type: license.type,
        status: license.status,
        deviceLimit: license.deviceLimit,
        activations: license.activations,
        expiresAt: license.expiresAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message || 'Verification error' }, { status: 500 });
  }
}

// POST /api/license/activate: Activate license key on this device
export async function POST(req: NextRequest) {
  try {
    const { licenseKey: rawKey, deviceName, action } = await req.json();

    if (!rawKey) {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    const license = await findLicenseByKey(rawKey);

    if (!license) {
      return NextResponse.json({ error: 'Invalid license key. Please check your key and try again.' }, { status: 404 });
    }

    if (action === 'deactivate') {
      const newActivations = Math.max(0, (license.activations || 1) - 1);
      await updateLicenseActivations(license.id, newActivations);
      return NextResponse.json({ success: true, message: 'License deactivated on this device' });
    }

    if (license.status !== 'active') {
      return NextResponse.json({ error: `This license is currently ${license.status}.` }, { status: 403 });
    }

    if (license.expiresAt && new Date(license.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This license has expired.' }, { status: 403 });
    }

    // Check device limit
    if (license.activations >= license.deviceLimit) {
      return NextResponse.json({
        error: `Device limit reached (${license.activations}/${license.deviceLimit} active devices). Deactivate on another device first.`,
      }, { status: 403 });
    }

    // Increment activation count in Neon / DB
    const deviceId = uuidv4();
    await updateLicenseActivations(license.id, (license.activations || 0) + 1);

    return NextResponse.json({
      success: true,
      deviceId,
      license: {
        licenseKey: license.licenseKey,
        type: license.type,
        status: license.status,
        deviceLimit: license.deviceLimit,
        expiresAt: license.expiresAt,
        activatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to activate license:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

