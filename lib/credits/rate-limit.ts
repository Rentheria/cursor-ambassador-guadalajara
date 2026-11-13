type Bucket = { timestamps: number[] };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number): void {
	bucket.timestamps = bucket.timestamps.filter((stamp) => now - stamp < WINDOW_MS);
}

export function clientKeyFromRequest(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0]?.trim();
		if (first) return first;
	}
	return request.headers.get('x-real-ip')?.trim() || 'local';
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
