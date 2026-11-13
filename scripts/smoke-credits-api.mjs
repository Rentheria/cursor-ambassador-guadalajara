import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.SMOKE_PORT ?? '3013';
const BASE = `http://127.0.0.1:${PORT}`;
const STORE = path.join(ROOT, '.data', 'credits-smoke.json');

async function fetchWithTimeout(url, options = {}, timeoutMs = 10_000) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

async function waitForReady(proc, timeoutMs = 45_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetchWithTimeout(`${BASE}/creditos`, { method: 'GET' }, 5_000);
			if (res.status === 200) return;
		} catch {
			// not ready
		}
		await delay(400);
		if (proc.exitCode !== null) {
			throw new Error(`smoke-credits-api: server exited early with code ${proc.exitCode}`);
		}
	}
	throw new Error('smoke-credits-api: server did not become ready in time');
}

async function jsonPost(url, body) {
	const res = await fetchWithTimeout(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	return { res, body: await res.json() };
}

async function main() {
	rmSync(STORE, { force: true });

	const proc = spawn('pnpm', ['exec', 'next', 'start', '--port', PORT], {
		cwd: ROOT,
		env: {
			...process.env,
			PORT,
			CREDITS_ADMIN_PASSWORD: 'test-admin-password',
			CREDITS_MODE: 'pool',
			CREDITS_GUESTS_PATH: path.join(ROOT, 'fixtures/credits/luma-guests.sample.csv'),
			CREDITS_POOL_PATH: path.join(ROOT, 'fixtures/credits/codes.sample.txt'),
			CREDITS_STORE_PATH: STORE,
			NEXT_PUBLIC_SITE_URL: BASE,
		},
		stdio: ['ignore', 'pipe', 'pipe'],
	});

	proc.stdout?.on('data', () => {});
	proc.stderr?.on('data', () => {});

	try {
		await waitForReady(proc);

		const first = await jsonPost(`${BASE}/api/credits/claim`, { email: '  ANA.BUILDER@example.com ' });
		if (first.body.status !== 'ok' || first.body.reused !== false) {
			throw new Error(`expected first claim ok, got ${JSON.stringify(first.body)}`);
		}

		const again = await jsonPost(`${BASE}/api/credits/claim`, { email: 'ana.builder@example.com' });
		if (again.body.credit !== first.body.credit || again.body.reused !== true) {
			throw new Error(`expected idempotent reclaim, got ${JSON.stringify(again.body)}`);
		}

		const unknown = await jsonPost(`${BASE}/api/credits/claim`, { email: 'not.on.the.list@example.com' });
		if (unknown.body.status !== 'not_registered') {
			throw new Error(`expected not_registered, got ${JSON.stringify(unknown.body)}`);
		}

		const login = await jsonPost(`${BASE}/api/credits/admin/login`, { password: 'test-admin-password' });
		if (!login.res.ok) {
			throw new Error(`admin login failed ${login.res.status} ${JSON.stringify(login.body)}`);
		}
		const cookie = login.res.headers.get('set-cookie');
		if (!cookie) throw new Error('admin login missing set-cookie');

		const summaryRes = await fetchWithTimeout(`${BASE}/api/credits/admin`, {
			headers: { cookie, Origin: BASE, Host: new URL(BASE).host },
		});
		const summary = await summaryRes.json();
		if (!summary.claimed?.some((row) => row.email === 'ana.builder@example.com')) {
			throw new Error(`admin summary missing claim: ${JSON.stringify(summary)}`);
		}

		const exportGet = await fetchWithTimeout(`${BASE}/api/credits/admin/export?kind=claimed`, {
			headers: { cookie, Origin: BASE, Host: new URL(BASE).host },
		});
		if (exportGet.status !== 405) {
			throw new Error(`expected export GET 405, got ${exportGet.status}`);
		}

		const exportRes = await fetchWithTimeout(`${BASE}/api/credits/admin/export`, {
			method: 'POST',
			headers: {
				cookie,
				Origin: BASE,
				Host: new URL(BASE).host,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ kind: 'claimed' }),
		});
		const csv = await exportRes.text();
		if (!exportRes.ok || !csv.includes('ana.builder@example.com')) {
			throw new Error(`export POST failed ${exportRes.status} ${csv.slice(0, 200)}`);
		}

		console.log('smoke-credits-api: OK (claim, reclaim, not_registered, admin, export POST)');
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
