import { NextResponse } from 'next/server';
import { buildAdminSummary } from '@/lib/credits/admin-summary';
import { requireAdmin } from '@/lib/credits/auth';
import { parseCreditPool, parseLumaGuestsCsv } from '@/lib/credits/csv';
import { loadCreditsState, updateCreditsState } from '@/lib/credits/store';
import type { CreditsMode } from '@/lib/credits/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const denied = await requireAdmin(request);
	if (denied) return denied;

	const state = await loadCreditsState();
	return NextResponse.json(buildAdminSummary(state));
}

export async function POST(request: Request) {
	const denied = await requireAdmin(request);
	if (denied) return denied;

	const form = await request.formData();
	const guestsFile = form.get('guests');
	const poolFile = form.get('pool');
	const guestsText = form.get('guestsText');
	const poolText = form.get('poolText');
	const modeValue = form.get('mode');
	const sharedLink = form.get('sharedLink');

	const next = await updateCreditsState(async (state) => {
		let guests = state.guests;
		let pool = state.pool;
		let mode: CreditsMode = state.mode;
		let link = state.sharedLink;

		const csvPayload = await readTextField(guestsFile, guestsText);
		if (csvPayload !== null) {
			guests = parseLumaGuestsCsv(csvPayload);
		}

		const poolPayload = await readTextField(poolFile, poolText);
		if (poolPayload !== null) {
			const assigned = new Set(state.assignments.map((entry) => entry.credit));
			pool = parseCreditPool(poolPayload).filter((code) => !assigned.has(code));
		}

		if (typeof modeValue === 'string' && (modeValue === 'pool' || modeValue === 'shared' || modeValue === 'dual')) {
			mode = modeValue;
		}

		if (typeof sharedLink === 'string') {
			link = sharedLink.trim();
		}

		return { ...state, guests, pool, mode, sharedLink: link };
	});

	return NextResponse.json(buildAdminSummary(next));
}

async function readTextField(file: FormDataEntryValue | null, text: FormDataEntryValue | null): Promise<string | null> {
	if (file instanceof File && file.size > 0) {
		return file.text();
	}
	if (typeof text === 'string' && text.trim()) {
		return text;
	}
	return null;
}
