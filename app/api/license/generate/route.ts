import { NextRequest, NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin-auth';
import { listAllLicenses, insertLicense, setLicenseStatus, updateLicenseActivations } from '@/src/db/licenses-repo';

function generateFormattedKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars like 0/O, 1/I
  const segment = (len: number) => {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  };
  return `NEXUS-${segment(5)}-${segment(5)}-${segment(5)}`;
}

// GET /api/license/generate: List all licenses (Admin authenticated only)
export async function GET(req: NextRequest) {
  const session = await checkAdminSession(req);
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const all = await listAllLicenses();
    return NextResponse.json({ success: true, licenses: all });
  } catch (error: any) {
    console.error('Failed to list licenses from Neon/DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to list licenses' }, { status: 500 });
  }
}

// POST /api/license/generate: Generate a new standalone license key (Admin authenticated only)
export async function POST(req: NextRequest) {
  const session = await checkAdminSession(req);
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || 'lifetime';
    const deviceLimit = Number(body.deviceLimit) || 3;
    const label = body.label || '';

    const licenseKey = generateFormattedKey();

    let expiresAt: Date | null = null;
    if (type === 'trial') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // 14-day trial
    } else if (type === 'monthly') {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (type === 'annual' || type === 'yearly') {
      expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      // 'lifetime' -> null expiresAt
      expiresAt = null;
    }

    const newRecord = await insertLicense({
      licenseKey,
      type,
      status: 'active',
      deviceLimit,
      label,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      license: newRecord,
    });
  } catch (error: any) {
    console.error('Failed to generate license:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/license/generate: Revoke a license (Admin authenticated only)
export async function DELETE(req: NextRequest) {
  const session = await checkAdminSession(req);
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const licenseKey = searchParams.get('key');

    if (!id && !licenseKey) {
      return NextResponse.json({ error: 'License ID or key required' }, { status: 400 });
    }

    await setLicenseStatus({ id: id || undefined, key: licenseKey || undefined }, 'revoked');

    return NextResponse.json({ success: true, message: 'License revoked successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to revoke license' }, { status: 500 });
  }
}

// PATCH /api/license/generate: Update license status or reset device usage (Admin authenticated only)
export async function PATCH(req: NextRequest) {
  const session = await checkAdminSession(req);
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const { id, key, status, action } = await req.json();
    if (!id && !key) {
      return NextResponse.json({ error: 'License ID or key required' }, { status: 400 });
    }

    if (action === 'reset_activations') {
      if (id) {
        await updateLicenseActivations(id, 0);
      }
      return NextResponse.json({ success: true, message: 'Device activations reset to 0' });
    }

    const newStatus = status === 'active' ? 'active' : 'revoked';
    await setLicenseStatus({ id, key }, newStatus);

    return NextResponse.json({ success: true, message: `License status set to ${newStatus}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update license status' }, { status: 500 });
  }
}

