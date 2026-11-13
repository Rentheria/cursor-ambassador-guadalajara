/**
 * Same-origin checks for cookie-authenticated admin APIs.
 * Browser fetch from the organizer panel sends Origin; scripts may send Referer.
 */

export function isSameOriginRequest(request: Request): boolean {
	const host = request.headers.get('host');
	if (!host) return false;
	const expected = host.toLowerCase();

	const origin = request.headers.get('origin');
	if (origin) {
		try {
			return new URL(origin).host.toLowerCase() === expected;
		} catch {
			return false;
		}
	}

	const referer = request.headers.get('referer');
	if (referer) {
		try {
			return new URL(referer).host.toLowerCase() === expected;
		} catch {
			return false;
		}
	}

	return request.headers.get('sec-fetch-site')?.toLowerCase() === 'same-origin';
}

/** Prefer the proxy-declared scheme so HTTP e2e stays non-Secure and HTTPS deploys stay Secure. */
export function cookieSecureFromRequest(request: Request): boolean {
	const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
	if (proto === 'https') return true;
	if (proto === 'http') return false;
	try {
		return new URL(request.url).protocol === 'https:';
	} catch {
		return false;
	}
}
