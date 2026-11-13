import 'server-only';

import { creditsStoreKind } from './config';
import { kvFetch } from './kv';
import { consumeRateLimit } from './rate-limit';

const WINDOW_SEC = 600;
const MAX_PER_WINDOW = 8;

const INCR_EXPIRE = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return c
`;

export async function limitClient(key: string): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
	if (creditsStoreKind() !== 'kv') {
		return consumeRateLimit(key);
	}

	const redisKey = `credits:rl:${key}`;
	const counted = await kvFetch(['EVAL', INCR_EXPIRE.trim(), '1', redisKey, String(WINDOW_SEC)]);
	const count = Number(counted.result);
	if (Number.isFinite(count) && count <= MAX_PER_WINDOW) {
		return { ok: true };
	}

	const ttl = await kvFetch(['TTL', redisKey]);
	const retryAfterSec = Math.max(1, Number(ttl.result) || WINDOW_SEC);
	return { ok: false, retryAfterSec };
}
