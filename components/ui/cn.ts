/** Tiny class joiner — no external deps. Safe to copy into Thailand. */
export function cn(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ');
}
