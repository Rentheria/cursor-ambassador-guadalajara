import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/credits/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	return clearAdminCookie(NextResponse.json({ ok: true }), request);
}
