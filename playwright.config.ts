import { defineConfig } from '@playwright/test';
import path from 'node:path';

const PORT = process.env.E2E_PORT ?? '3011';
const BASE = `http://127.0.0.1:${PORT}`;
const storePath = path.join(process.cwd(), '.data', 'credits-e2e.json');

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 15_000 },
	retries: 0,
	use: {
		baseURL: BASE,
		locale: 'es-MX',
		trace: 'off',
	},
	webServer: {
		command: `rm -f "${storePath}" && pnpm exec next start --port ${PORT}`,
		url: `${BASE}/creditos`,
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			...process.env,
			PORT,
			CREDITS_ADMIN_PASSWORD: 'test-admin-password',
			CREDITS_MODE: 'pool',
			CREDITS_GUESTS_PATH: path.join(process.cwd(), 'fixtures/credits/luma-guests.sample.csv'),
			CREDITS_POOL_PATH: path.join(process.cwd(), 'fixtures/credits/codes.sample.txt'),
			CREDITS_STORE_PATH: storePath,
			NEXT_PUBLIC_SITE_URL: BASE,
		},
	},
});
