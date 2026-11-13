export const CLAIM_TIMEZONE = 'America/Mexico_City';

export type ClaimWindowStatus = 'open' | 'not_open' | 'closed';

export type ClaimWindowSnapshot = {
	status: ClaimWindowStatus;
	openAt: string | null;
	closeAt: string | null;
};

export function parseClaimInstant(raw: string | undefined | null): Date | null {
	const value = (raw ?? '').trim();
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function evaluateClaimWindow(now: Date, openAt: Date | null, closeAt: Date | null): ClaimWindowStatus {
	let close = closeAt;
	if (openAt && close && close.getTime() <= openAt.getTime()) {
		close = null;
	}
	if (openAt && now.getTime() < openAt.getTime()) return 'not_open';
	if (close && now.getTime() >= close.getTime()) return 'closed';
	return 'open';
}

export function getClaimWindowSnapshot(
	now = new Date(),
	openRaw = process.env.CREDITS_OPEN_AT,
	closeRaw = process.env.CREDITS_CLOSE_AT,
): ClaimWindowSnapshot {
	const openAt = parseClaimInstant(openRaw);
	let closeAt = parseClaimInstant(closeRaw);
	if (openAt && closeAt && closeAt.getTime() <= openAt.getTime()) {
		closeAt = null;
	}
	return {
		status: evaluateClaimWindow(now, openAt, closeAt),
		openAt: openAt ? openAt.toISOString() : null,
		closeAt: closeAt ? closeAt.toISOString() : null,
	};
}

/** "sábado 14 de nov a las 10:00" / "Saturday 14 Nov at 10:00" */
export function formatClaimMoment(date: Date, locale = 'es-MX'): string {
	const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: CLAIM_TIMEZONE }).format(date);
	const day = new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: CLAIM_TIMEZONE }).format(date);
	const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: CLAIM_TIMEZONE })
		.format(date)
		.replace(/\.$/, '');
	const time = new Intl.DateTimeFormat(locale, {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		hourCycle: 'h23',
		timeZone: CLAIM_TIMEZONE,
	}).format(date);

	if (locale.toLowerCase().startsWith('es')) {
		return `${weekday} ${day} de ${month} a las ${time}`;
	}
	return `${weekday} ${day} ${month} at ${time}`;
}
