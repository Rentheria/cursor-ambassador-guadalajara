export type CreditsMode = 'pool' | 'shared' | 'dual';

export type CreditPath = 'new' | 'existing';

export type Guest = {
	email: string;
	name: string;
	approvalStatus: string;
	eligible: boolean;
};

export type Assignment = {
	email: string;
	name: string;
	credit: string;
	claimedAt: string;
	path: CreditPath | null;
};

export type FailedAttemptReason = 'invalid' | 'not_registered' | 'exhausted' | 'unavailable';

export type FailedAttempt = {
	email: string;
	at: string;
	reason: FailedAttemptReason;
};

export type CreditsState = {
	version: 1;
	mode: CreditsMode;
	sharedLink: string;
	linkNewUsers: string;
	linkExistingUsers: string;
	guests: Guest[];
	/** Unused unique codes/links, consumed from the front. */
	pool: string[];
	assignments: Assignment[];
	failedAttempts: FailedAttempt[];
};

export type ClaimStatus = 'ok' | 'invalid' | 'not_registered' | 'exhausted' | 'unavailable';

export type DualNeedsPathResult = {
	status: 'ok';
	mode: 'dual';
	needsPath: true;
	path: CreditPath | null;
	credit?: undefined;
	reused: boolean;
};

export type DualCreditResult = {
	status: 'ok';
	mode: 'dual';
	needsPath?: false;
	path: CreditPath;
	credit: string;
	reused: boolean;
};

export type UniqueCreditResult = {
	status: 'ok';
	credit: string;
	reused: boolean;
	mode?: 'pool' | 'shared';
	needsPath?: undefined;
	path?: undefined;
};

export type ClaimResult =
	| UniqueCreditResult
	| DualNeedsPathResult
	| DualCreditResult
	| { status: Exclude<ClaimStatus, 'ok'>; credit?: undefined; reused?: undefined };

export const FAILED_ATTEMPT_CAP = 500;

export function parseCreditsMode(raw: string | undefined | null): CreditsMode {
	const value = (raw ?? '').trim().toLowerCase();
	if (value === 'shared') return 'shared';
	if (value === 'dual') return 'dual';
	return 'pool';
}

export function parseCreditPath(raw: unknown): CreditPath | null {
	return raw === 'new' || raw === 'existing' ? raw : null;
}
