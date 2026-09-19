import { NextRequest, NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const session = await checkAdminSession(req);
  return NextResponse.json(session);
}
