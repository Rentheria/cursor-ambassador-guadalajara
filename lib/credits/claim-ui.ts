export type ClaimUiStatus =
	| 'ok'
	| 'invalid'
	| 'not_registered'
	| 'exhausted'
	| 'unavailable'
	| 'rate_limited'
	| 'forbidden';

export type ClaimUiPhase = 'form' | 'success' | 'message';

export function claimUiPhase(status: ClaimUiStatus | null | undefined): ClaimUiPhase {
	if (!status) return 'form';
	if (status === 'ok') return 'success';
	return 'message';
}

export const CLAIM_MESSAGE_KEYS = {
	not_registered: {
		heading: 'credits.notFoundHeading',
		body: 'credits.notFoundBody',
		testId: 'credits-not-registered',
	},
	exhausted: { heading: 'credits.exhaustedHeading', body: 'credits.exhaustedBody', testId: 'credits-exhausted' },
	invalid: { heading: 'credits.invalidHeading', body: 'credits.invalid', testId: 'credits-invalid' },
	rate_limited: {
		heading: 'credits.rateLimitedHeading',
		body: 'credits.rateLimited',
		testId: 'credits-rate-limited',
	},
	unavailable: {
		heading: 'credits.unavailableHeading',
		body: 'credits.unavailable',
		testId: 'credits-unavailable',
	},
	forbidden: { heading: 'credits.needQrHeading', body: 'credits.needQrBody', testId: 'credits-forbidden' },
} as const;

export type ClaimMessageStatus = keyof typeof CLAIM_MESSAGE_KEYS;

export function isClaimMessageStatus(status: ClaimUiStatus): status is ClaimMessageStatus {
	return status !== 'ok' && status in CLAIM_MESSAGE_KEYS;
}
