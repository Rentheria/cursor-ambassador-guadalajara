import { NextResponse } from 'next/server';
import { unclaimedGuests } from '@/lib/credits/assign';
import { isAdminRequest, passwordConfigured, unauthorized } from '@/lib/credits/auth';
import { toCsv } from '@/lib/credits/csv';
import { loadCreditsState } from '@/lib/credits/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function exportKind(request: Request): Promise<string> {
	const fromQuery = new URL(request.url).searchParams.get('kind');
	const contentType = request.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		try {
			const body = (await request.json()) as { kind?: unknown };
			if (typeof body.kind === 'string' && body.kind) return body.kind;
		} catch {
			// fall through to query
		}
	}
	return fromQuery ?? 'claimed';
}

export async function POST(request: Request) {
	if (!passwordConfigured()) {
		return NextResponse.json({ error: 'admin_unconfigured' }, { status: 503 });
	}
	if (!isAdminRequest(request)) return unauthorized();

	const kind = await exportKind(request);
	const state = await loadCreditsState();

	let filename = 'credits-claimed.csv';
	let rows: string[][] = [];

	if (kind === 'unclaimed') {
		filename = 'credits-unclaimed.csv';
		rows = [
			['name', 'email', 'approval_status'],
			...unclaimedGuests(state).map((guest) => [guest.name, guest.email, guest.approvalStatus]),
		];
	} else if (kind === 'failed') {
		filename = 'credits-failed-attempts.csv';
		rows = [['email', 'at', 'reason'], ...state.failedAttempts.map((entry) => [entry.email, entry.at, entry.reason])];
	} else {
		rows = [
			['name', 'email', 'credit', 'claimed_at'],
			...state.assignments.map((entry) => [entry.name, entry.email, entry.credit, entry.claimedAt]),
		];
	}

	const body = `${toCsv(rows)}\n`;
	return new NextResponse(body, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store',
		},
	});
}

export async function GET() {
	return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST' } });
}
