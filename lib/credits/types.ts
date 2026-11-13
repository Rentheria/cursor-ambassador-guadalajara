export type CreditsMode = 'pool' | 'shared';

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
	guests: Guest[];
	/** Unused unique codes/links, consumed from the front. */
	pool: string[];
	assignments: Assignment[];
	failedAttempts: FailedAttempt[];
};

export type ClaimStatus = 'ok' | 'invalid' | 'not_registered' | 'exhausted' | 'unavailable';

export type ClaimResult =
	| { status: 'ok'; credit: string; reused: boolean }
	| { status: Exclude<ClaimStatus, 'ok'>; credit?: undefined; reused?: undefined };

export const FAILED_ATTEMPT_CAP = 500;
