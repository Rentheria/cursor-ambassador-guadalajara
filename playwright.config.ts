import { defineConfig } from '@playwright/test';
import path from 'node:path';

const PORT = process.env.E2E_PORT ?? '3011';
const WINDOW_PORT = process.env.E2E_WINDOW_PORT ?? '3012';
const DUAL_PORT = process.env.E2E_DUAL_PORT ?? '3013';
const BASE = `http://127.0.0.1:${PORT}`;
const WINDOW_BASE = `http://127.0.0.1:${WINDOW_PORT}`;
const DUAL_BASE = `http://127.0.0.1:${DUAL_PORT}`;
const storePath = path.join(process.cwd(), '.data', 'credits-e2e.json');
const windowStorePath = path.join(process.cwd(), '.data', 'credits-e2e-window.json');
const dualStorePath = path.join(process.cwd(), '.data', 'credits-e2e-dual.json');

const guestsPath = path.join(process.cwd(), 'fixtures/credits/luma-guests.sample.csv');
const poolPath = path.join(process.cwd(), 'fixtures/credits/codes.sample.txt');

function creditsServerEnv(port: string, siteUrl: string, storeFile: string, extra: Record<string, string> = {}) {
	return {
		...process.env,
		PORT: port,
		CREDITS_ADMIN_PASSWORD: 'test-admin-password',
		CREDITS_MODE: 'pool',
		CREDITS_GUESTS_PATH: guestsPath,
		CREDITS_POOL_PATH: poolPath,
		CREDITS_STORE_PATH: storeFile,
		NEXT_PUBLIC_SITE_URL: siteUrl,
		CREDITS_OPEN_AT: '',
		CREDITS_CLOSE_AT: '',
		CREDITS_CLAIM_TOKEN: '',
		...extra,
	};
}

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 15_000 },
	retries: 0,
	projects: [
		{ name: 'claim-open', testIgnore: /credits-window\.spec\.ts|credits-dual\.spec\.ts/ },
		{ name: 'claim-window', testMatch: /credits-window\.spec\.ts/, use: { baseURL: WINDOW_BASE } },
		{ name: 'claim-dual', testMatch: /credits-dual\.spec\.ts/, use: { baseURL: DUAL_BASE } },
	],
	use: {
		baseURL: BASE,
		locale: 'es-MX',
		trace: 'off',
	},
	webServer: [
		{
			command: `rm -f "${storePath}" && pnpm exec next start --port ${PORT}`,
			url: `${BASE}/creditos`,
			reuseExistingServer: false,
			timeout: 120_000,
			env: creditsServerEnv(PORT, BASE, storePath),
		},
		{
			command: `rm -f "${windowStorePath}" && pnpm exec next start --port ${WINDOW_PORT}`,
			url: `${WINDOW_BASE}/creditos`,
			reuseExistingServer: false,
			timeout: 120_000,
			env: creditsServerEnv(WINDOW_PORT, WINDOW_BASE, windowStorePath, {
				CREDITS_OPEN_AT: '2099-11-14T10:00:00-06:00',
			}),
		},
		{
			command: `rm -f "${dualStorePath}" && pnpm exec next start --port ${DUAL_PORT}`,
			url: `${DUAL_BASE}/creditos`,
			reuseExistingServer: false,
			timeout: 120_000,
			env: creditsServerEnv(DUAL_PORT, DUAL_BASE, dualStorePath, {
				CREDITS_MODE: 'dual',
				CREDITS_LINK_NEW_USERS: 'https://grok.com/refer/TEST-NEW-USER',
				CREDITS_LINK_EXISTING_USERS: 'https://cursor.com/redeem/event/TEST-EXISTING',
			}),
		},
	],
});
