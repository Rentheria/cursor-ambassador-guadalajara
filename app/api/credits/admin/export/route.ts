import { NextResponse } from 'next/server';
import { unclaimedGuests } from '@/lib/credits/assign';
import { isAdminRequest, passwordConfigured, unauthorized } from '@/lib/credits/auth';
import { toCsv } from '@/lib/credits/csv';
import { loadCreditsState } from '@/lib/credits/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	if (!passwordConfigured()) {
		return NextResponse.json({ error: 'admin_unconfigured' }, { status: 503 });
	}
	if (!isAdminRequest(request)) return unauthorized();

	const { searchParams } = new URL(request.url);
	const kind = searchParams.get('kind') ?? 'claimed';
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
