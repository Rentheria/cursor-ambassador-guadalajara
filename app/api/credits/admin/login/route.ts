import { NextResponse } from 'next/server';
import { attachAdminCookie, createAdminToken, passwordConfigured, verifyAdminPassword } from '@/lib/credits/auth';
import { clientKeyFromRequest } from '@/lib/credits/rate-limit';
import { limitClient } from '@/lib/credits/limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	if (!passwordConfigured()) {
		return NextResponse.json({ error: 'admin_unconfigured' }, { status: 503 });
	}

	const limited = await limitClient(`admin-login:${clientKeyFromRequest(request)}`);
	if (!limited.ok) {
		return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
	}

	let password = '';
	try {
		const body = (await request.json()) as { password?: unknown };
		password = typeof body.password === 'string' ? body.password : '';
	} catch {
		return NextResponse.json({ error: 'invalid' }, { status: 400 });
	}

	if (!verifyAdminPassword(password)) {
		return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
	}

	const response = NextResponse.json({ ok: true });
	return attachAdminCookie(response, createAdminToken(), request);
}
