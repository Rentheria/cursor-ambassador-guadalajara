const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim, lowercase, and reject strings that are not a plausible email. */
export function normalizeEmail(raw: string | null | undefined): string | null {
	if (typeof raw !== 'string') return null;
	const email = raw.trim().toLowerCase();
	if (email.length < 3 || email.length > 254) return null;
	if (!EMAIL_PATTERN.test(email)) return null;
	return email;
}

export function emailsMatch(a: string, b: string): boolean {
	const left = normalizeEmail(a);
	const right = normalizeEmail(b);
	return Boolean(left && right && left === right);
}
