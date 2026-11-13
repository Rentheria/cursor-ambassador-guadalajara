import { NextResponse } from 'next/server';
import { claimCredit } from '@/lib/credits/assign';
import { verifyClaimToken } from '@/lib/credits/auth';
import { clientKeyFromRequest } from '@/lib/credits/rate-limit';
import { limitClient } from '@/lib/credits/limit';
import { updateCreditsState } from '@/lib/credits/store';
import type { ClaimResult } from '@/lib/credits/types';
import { getClaimWindowSnapshot } from '@/lib/credits/window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	const limited = await limitClient(`claim:${clientKeyFromRequest(request)}`);
	if (!limited.ok) {
		return NextResponse.json(
			{ status: 'rate_limited' },
			{ status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
		);
	}

	let email = '';
	let token: string | undefined;
	try {
		const body = (await request.json()) as { email?: unknown; token?: unknown };
		email = typeof body.email === 'string' ? body.email : '';
		token = typeof body.token === 'string' ? body.token : undefined;
	} catch {
		return NextResponse.json({ status: 'invalid' }, { status: 400 });
	}

	if (!token) {
		token = new URL(request.url).searchParams.get('k') ?? undefined;
	}

	const windowStatus = getClaimWindowSnapshot().status;
	if (windowStatus !== 'open') {
		return NextResponse.json({ status: windowStatus }, { status: 403 });
	}

	if (!verifyClaimToken(token)) {
		return NextResponse.json({ status: 'forbidden' }, { status: 403 });
	}

	const captured: { result: ClaimResult } = { result: { status: 'unavailable' } };
	await updateCreditsState((state) => {
		const claimed = claimCredit(state, email);
		captured.result = claimed.result;
		return claimed.state;
	});

	if (captured.result.status === 'ok') {
		return NextResponse.json({
			status: 'ok',
			credit: captured.result.credit,
			reused: captured.result.reused,
		});
	}

	const httpStatus = captured.result.status === 'invalid' ? 400 : captured.result.status === 'unavailable' ? 503 : 200;
	return NextResponse.json({ status: captured.result.status }, { status: httpStatus });
}
