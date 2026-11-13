import { normalizeEmail } from './email';
import {
	FAILED_ATTEMPT_CAP,
	type Assignment,
	type ClaimResult,
	type CreditsMode,
	type CreditsState,
	type FailedAttemptReason,
	type Guest,
} from './types';

export function createCreditsState(partial?: Partial<CreditsState>): CreditsState {
	return {
		version: 1,
		mode: partial?.mode ?? 'pool',
		sharedLink: partial?.sharedLink ?? '',
		guests: partial?.guests ?? [],
		pool: partial?.pool ?? [],
		assignments: partial?.assignments ?? [],
		failedAttempts: partial?.failedAttempts ?? [],
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
	return assignments.find((entry) => entry.email === email);
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

/**
 * Pure claim: registered + eligible emails receive a credit.
 * Re-claims are idempotent (same email → same credit).
 */
export function claimCredit(
	state: CreditsState,
	rawEmail: string,
	now = new Date(),
): { state: CreditsState; result: ClaimResult } {
	const at = now.toISOString();
	const email = normalizeEmail(rawEmail);

	if (!email) {
		return { state: recordFailure(state, (rawEmail ?? '').trim(), 'invalid', at), result: { status: 'invalid' } };
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
	if (existing) {
		return { state, result: { status: 'ok', credit: existing.credit, reused: true } };
	}

	const mode: CreditsMode = state.mode === 'shared' ? 'shared' : 'pool';
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
	if (state.mode === 'shared') return state.sharedLink.trim() ? Number.POSITIVE_INFINITY : 0;
	return state.pool.length;
}
