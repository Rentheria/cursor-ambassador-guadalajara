import { remainingCredits, unclaimedGuests } from './assign';
import { creditsStoreKind } from './config';
import type { CreditsState } from './types';

export function buildAdminSummary(state: CreditsState) {
	const eligible = state.guests.filter((guest) => guest.eligible);
	const remaining = remainingCredits(state);

	return {
		mode: state.mode,
		storeKind: creditsStoreKind(),
		sharedLinkConfigured: Boolean(state.sharedLink.trim()),
		stats: {
			guests: state.guests.length,
			eligible: eligible.length,
			ineligible: state.guests.length - eligible.length,
			claimed: state.assignments.length,
			unclaimed: unclaimedGuests(state).length,
			remainingCodes: Number.isFinite(remaining) ? remaining : null,
			failedAttempts: state.failedAttempts.length,
		},
		claimed: state.assignments.map((entry) => ({
			email: entry.email,
			name: entry.name,
			credit: entry.credit,
			claimedAt: entry.claimedAt,
		})),
		unclaimed: unclaimedGuests(state).map((guest) => ({
			email: guest.email,
			name: guest.name,
			approvalStatus: guest.approvalStatus,
		})),
		ineligible: state.guests
			.filter((guest) => !guest.eligible)
			.map((guest) => ({
				email: guest.email,
				name: guest.name,
				approvalStatus: guest.approvalStatus,
			})),
		failed: state.failedAttempts,
	};
}
