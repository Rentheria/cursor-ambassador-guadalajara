import 'server-only';

import { getCreditsRuntimeConfig } from './config';

const LOCK_KEY = 'credits:lock';
const LOCK_TTL_SEC = 10;
const LOCK_WAIT_MS = 8_000;

const RELEASE_LOCK = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`;

export async function kvFetch(body: unknown): Promise<{ result?: unknown }> {
	const { kvUrl, kvToken } = getCreditsRuntimeConfig();
	const response = await fetch(kvUrl.replace(/\/$/, ''), {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${kvToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		cache: 'no-store',
	});
	if (!response.ok) {
		throw new Error(`credits kv ${response.status}`);
	}
	return (await response.json()) as { result?: unknown };
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/** Cross-instance lock so GET → mutate → SET cannot double-assign a pool code. */
export async function withKvLock<T>(task: () => Promise<T>): Promise<T> {
	const token = crypto.randomUUID();
	const deadline = Date.now() + LOCK_WAIT_MS;

	while (Date.now() < deadline) {
		const acquired = await kvFetch(['SET', LOCK_KEY, token, 'NX', 'EX', String(LOCK_TTL_SEC)]);
		if (acquired.result === 'OK') {
			try {
				return await task();
			} finally {
				await kvFetch(['EVAL', RELEASE_LOCK, '1', LOCK_KEY, token]);
			}
		}
		await sleep(40 + Math.floor(Math.random() * 80));
	}

	throw new Error('credits kv lock timeout');
}
