import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREEN_DIR = process.env.CREDITS_SCREENSHOT_DIR || path.join(process.cwd(), 'e2e/screenshots');
const ARTIFACTS_DIR = '/opt/cursor/artifacts';

function screenshotPath(name: string): string {
	fs.mkdirSync(SCREEN_DIR, { recursive: true });
	if (fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
	return path.join(SCREEN_DIR, name);
}

async function saveShot(page: Page, name: string) {
	const dest = screenshotPath(name);
	await page.screenshot({ path: dest, fullPage: true });
	if (fs.existsSync(ARTIFACTS_DIR)) {
		fs.copyFileSync(dest, path.join(ARTIFACTS_DIR, name));
	}
}

test.describe.configure({ mode: 'serial' });

test('claim page stays closed until CREDITS_OPEN_AT', async ({ page, request }) => {
	const blocked = await request.post('/api/credits/claim', {
		data: { email: 'ana.builder@example.com' },
	});
	expect(blocked.status()).toBe(403);
	const body = (await blocked.json()) as { status: string; credit?: string };
	expect(body.status).toBe('not_open');
	expect(body.credit).toBeUndefined();
	expect(Object.keys(body)).toEqual(['status']);

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/creditos');
	await page.evaluate(() => {
		localStorage.setItem('cursor-theme', 'light');
		document.documentElement.setAttribute('data-theme', 'light');
		document.documentElement.style.colorScheme = 'light';
	});

	await expect(page.getByTestId('credits-hero')).toBeVisible();
	await expect(page.getByTestId('credits-not-open')).toBeVisible();
	await expect(page.getByTestId('credits-not-open')).toContainText(
		'La redención abre el sábado 14 de nov a las 10:00 (hora CDMX)',
	);
	await expect(page.getByTestId('credits-form')).toHaveCount(0);
	await expect(page.getByRole('button', { name: /Reclamar créditos/i })).toHaveCount(0);
	await expect(page.getByLabel(/Correo con el que te registraste/i)).toHaveCount(0);
	await saveShot(page, 'credits_not_open.png');
});
