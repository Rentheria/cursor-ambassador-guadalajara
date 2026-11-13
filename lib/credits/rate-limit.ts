type Bucket = { timestamps: number[] };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number): void {
	bucket.timestamps = bucket.timestamps.filter((stamp) => now - stamp < WINDOW_MS);
}

function firstHop(value: string | null): string | null {
	const hop = value?.split(',')[0]?.trim();
	return hop || null;
}

/**
 * Prefer platform-set client IPs. Ignore client-supplied `X-Forwarded-For`
 * when no trusted proxy header is present (otherwise the rate limit is trivial to rotate).
 */
export function clientKeyFromRequest(request: Request): string {
	const trusted =
		firstHop(request.headers.get('x-vercel-forwarded-for')) ||
		firstHop(request.headers.get('cf-connecting-ip')) ||
		firstHop(request.headers.get('true-client-ip')) ||
		firstHop(request.headers.get('x-real-ip'));
	if (trusted) return trusted;
	return 'direct';
}

export function consumeRateLimit(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfterSec: number } {
	const bucket = buckets.get(key) ?? { timestamps: [] };
	prune(bucket, now);

	if (bucket.timestamps.length >= MAX_PER_WINDOW) {
		const oldest = bucket.timestamps[0] ?? now;
		const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
		buckets.set(key, bucket);
		return { ok: false, retryAfterSec };
	}

	bucket.timestamps.push(now);
	buckets.set(key, bucket);
	return { ok: true };
}

export function resetRateLimitForTests(): void {
	buckets.clear();
}
