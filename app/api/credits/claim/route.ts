import { NextResponse } from 'next/server';
import { claimCredit } from '@/lib/credits/assign';
import { clientKeyFromRequest, consumeRateLimit } from '@/lib/credits/rate-limit';
import { updateCreditsState } from '@/lib/credits/store';
import type { ClaimResult } from '@/lib/credits/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	const limited = consumeRateLimit(`claim:${clientKeyFromRequest(request)}`);
	if (!limited.ok) {
		return NextResponse.json(
			{ status: 'rate_limited' },
			{ status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
		);
	}

	let email = '';
	try {
		const body = (await request.json()) as { email?: unknown };
		email = typeof body.email === 'string' ? body.email : '';
	} catch {
		return NextResponse.json({ status: 'invalid' }, { status: 400 });
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
