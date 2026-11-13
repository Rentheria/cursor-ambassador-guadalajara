import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.SMOKE_PORT ?? '3012';
const ALLOWLISTED_ID = '2044779723776028999';
const BASE = `http://127.0.0.1:${PORT}`;

async function fetchWithTimeout(url, timeoutMs = 10_000) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

async function waitForReady(proc, timeoutMs = 45_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetchWithTimeout(`${BASE}/api/tweets/${ALLOWLISTED_ID}`, 12_000);
			if (res.status === 200 || res.status === 404 || res.status === 502) return;
		} catch {
			// server not up yet, or request aborted
		}
		await delay(400);
		if (proc.exitCode !== null) {
			throw new Error(`smoke-tweets-api: server exited early with code ${proc.exitCode}`);
		}
	}
	throw new Error('smoke-tweets-api: server did not become ready in time');
}

async function main() {
	const proc = spawn('pnpm', ['start'], {
		cwd: ROOT,
		env: { ...process.env, PORT },
		stdio: ['ignore', 'pipe', 'pipe'],
	});

	proc.stdout?.on('data', () => {});
	proc.stderr?.on('data', () => {});

	try {
		await waitForReady(proc);

		const okRes = await fetchWithTimeout(`${BASE}/api/tweets/${ALLOWLISTED_ID}`, 12_000);
		const okBody = await okRes.json();
		// 200 = live Twitter ok; 502 = upstream timeout/unavailable (common on CI egress)
		if (okRes.status === 200) {
			if (!okBody?.data) {
				throw new Error(`smoke-tweets-api: allowlisted 200 missing data: ${JSON.stringify(okBody)}`);
			}
		} else if (okRes.status !== 502) {
			throw new Error(
				`smoke-tweets-api: allowlisted id expected 200 or 502, got ${okRes.status} ${JSON.stringify(okBody)}`,
			);
		}

		const badRes = await fetchWithTimeout(`${BASE}/api/tweets/9999999999999999999`, 5_000);
		if (badRes.status !== 400) {
			throw new Error(`smoke-tweets-api: unknown id expected 400, got ${badRes.status}`);
		}

		console.log(
			okRes.status === 200
				? 'smoke-tweets-api: OK (allowlisted 200 + data, unknown 400)'
				: 'smoke-tweets-api: OK (allowlisted 502 upstream, unknown 400)',
		);
	} finally {
		proc.kill('SIGTERM');
		await delay(500);
		if (proc.exitCode === null) proc.kill('SIGKILL');
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
