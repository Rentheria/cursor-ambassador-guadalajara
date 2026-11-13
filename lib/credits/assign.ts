import { normalizeEmail } from './email';
import {
	FAILED_ATTEMPT_CAP,
	parseCreditPath,
	parseCreditsMode,
	type Assignment,
	type ClaimResult,
	type CreditPath,
	type CreditsState,
	type FailedAttemptReason,
	type Guest,
} from './types';

export function createCreditsState(partial?: Partial<CreditsState>): CreditsState {
	return {
		version: 1,
		mode: parseCreditsMode(partial?.mode),
		sharedLink: partial?.sharedLink ?? '',
		linkNewUsers: partial?.linkNewUsers ?? '',
		linkExistingUsers: partial?.linkExistingUsers ?? '',
		guests: partial?.guests ?? [],
		pool: partial?.pool ?? [],
		assignments: (partial?.assignments ?? []).map(normalizeAssignment),
		failedAttempts: partial?.failedAttempts ?? [],
	};
}

function normalizeAssignment(entry: Assignment): Assignment {
	return {
		email: entry.email,
		name: entry.name,
		credit: entry.credit ?? '',
		claimedAt: entry.claimedAt,
		path: parseCreditPath(entry.path),
	};
}

function recordFailure(state: CreditsState, email: string, reason: FailedAttemptReason, at: string): CreditsState {
	const failedAttempts = [{ email, at, reason }, ...state.failedAttempts].slice(0, FAILED_ATTEMPT_CAP);
	return { ...state, failedAttempts };
}

function findGuest(guests: Guest[], email: string): Guest | undefined {
	return guests.find((guest) => guest.email === email);
}

function findAssignment(assignments: Assignment[], email: string): Assignment | undefined {
	return assignments.map(normalizeAssignment).find((entry) => entry.email === email);
}

function nextSharedCredit(state: CreditsState): string | null {
	const link = state.sharedLink.trim();
	return link ? link : null;
}

function nextPoolCredit(state: CreditsState): { credit: string; pool: string[] } | null {
	if (state.pool.length === 0) return null;
	const [credit, ...pool] = state.pool;
	return { credit, pool };
}

export function creditForPath(state: CreditsState, path: CreditPath): string | null {
	const link = (path === 'new' ? state.linkNewUsers : state.linkExistingUsers).trim();
	return link || null;
}

function dualLinksReady(state: CreditsState): boolean {
	return Boolean(state.linkNewUsers.trim() || state.linkExistingUsers.trim());
}

function upsertAssignment(state: CreditsState, assignment: Assignment): CreditsState {
	const rest = state.assignments.filter((entry) => entry.email !== assignment.email);
	return { ...state, assignments: [assignment, ...rest] };
}

/**
 * Pure claim: registered + eligible emails receive a credit.
 * Re-claims are idempotent for pool/shared (same email → same credit).
 * Dual mode asks which account path to use and may switch that path later.
 */
export function claimCredit(
	state: CreditsState,
	rawEmail: string,
	now = new Date(),
	rawPath?: unknown,
): { state: CreditsState; result: ClaimResult } {
	const at = now.toISOString();
	const email = normalizeEmail(rawEmail);
	const path = parseCreditPath(rawPath);

	if (!email) {
		const stored = (rawEmail ?? '').trim().slice(0, 254);
		return { state: recordFailure(state, stored, 'invalid', at), result: { status: 'invalid' } };
	}

	if (state.guests.length === 0) {
		return {
			state: recordFailure(state, email, 'unavailable', at),
			result: { status: 'unavailable' },
		};
	}

	const guest = findGuest(state.guests, email);
	if (!guest || !guest.eligible) {
		return { state: recordFailure(state, email, 'not_registered', at), result: { status: 'not_registered' } };
	}

	const existing = findAssignment(state.assignments, email);
	const mode = parseCreditsMode(state.mode);

	if (mode === 'dual') {
		if (!dualLinksReady(state)) {
			return { state: recordFailure(state, email, 'exhausted', at), result: { status: 'exhausted' } };
		}

		if (!path) {
			const assignment: Assignment = existing ?? {
				email,
				name: guest.name,
				credit: '',
				claimedAt: at,
				path: null,
			};
			return {
				state: existing ? state : upsertAssignment(state, assignment),
				result: {
					status: 'ok',
					mode: 'dual',
					needsPath: true,
					path: assignment.path,
					reused: Boolean(existing),
				},
			};
		}

		const credit = creditForPath(state, path);
		if (!credit) {
			return { state: recordFailure(state, email, 'exhausted', at), result: { status: 'exhausted' } };
		}

		const assignment: Assignment = {
			email,
			name: guest.name,
			credit,
			claimedAt: existing?.claimedAt ?? at,
			path,
		};

		return {
			state: upsertAssignment(state, assignment),
			result: { status: 'ok', mode: 'dual', path, credit, reused: Boolean(existing) },
		};
	}

	if (existing) {
		return { state, result: { status: 'ok', credit: existing.credit, reused: true } };
	}

	let credit: string | null = null;
	let pool = state.pool;

	if (mode === 'shared') {
		credit = nextSharedCredit(state);
	} else {
		const taken = nextPoolCredit(state);
		if (taken) {
			credit = taken.credit;
			pool = taken.pool;
		}
	}

	if (!credit) {
		return { state: recordFailure(state, email, 'exhausted', at), result: { status: 'exhausted' } };
	}

	const assignment: Assignment = {
		email,
		name: guest.name,
		credit,
		claimedAt: at,
		path: null,
	};

	return {
		state: {
			...state,
			pool,
			assignments: [assignment, ...state.assignments],
		},
		result: { status: 'ok', credit, reused: false },
	};
}

export function unclaimedGuests(state: CreditsState): Guest[] {
	const claimed = new Set(state.assignments.map((entry) => entry.email));
	return state.guests.filter((guest) => guest.eligible && !claimed.has(guest.email));
}

export function remainingCredits(state: CreditsState): number {
	const mode = parseCreditsMode(state.mode);
	if (mode === 'shared') return state.sharedLink.trim() ? Number.POSITIVE_INFINITY : 0;
	if (mode === 'dual') return dualLinksReady(state) ? Number.POSITIVE_INFINITY : 0;
	return state.pool.length;
}

export function publicClaimPayload(result: ClaimResult): Record<string, unknown> {
	if (result.status !== 'ok') {
		return { status: result.status };
	}
	if (result.mode === 'dual' && result.needsPath) {
		return {
			status: 'ok',
			mode: 'dual',
			needsPath: true,
			path: result.path,
			reused: result.reused,
		};
	}
	if (result.mode === 'dual') {
		return {
			status: 'ok',
			mode: 'dual',
			path: result.path,
			credit: result.credit,
			reused: result.reused,
		};
	}
	return { status: 'ok', credit: result.credit, reused: result.reused };
}
