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

test('claim page: registered, not registered, and admin', async ({ page, request }) => {
	await page.goto('/creditos');
	await expect(page.getByRole('heading', { name: /Reclama tus créditos de Cursor/i })).toBeVisible();
	await expect(page.getByText(/¿Organizas el evento/i)).toHaveCount(0);
	await expect(page.getByRole('link', { name: /Panel de organización/i })).toHaveCount(0);
	await saveShot(page, 'credits_claim_form.png');

	const first = await request.post('/api/credits/claim', {
		data: { email: '  ANA.BUILDER@example.com ' },
	});
	expect(first.status()).toBe(200);
	const firstBody = (await first.json()) as { status: string; credit: string; reused: boolean };
	expect(firstBody.status).toBe('ok');
	expect(firstBody.reused).toBe(false);
	expect(firstBody.credit).toBe('https://cursor.com/referral?code=FAKE-GDL-001');
	expect(Object.keys(firstBody).sort()).toEqual(['credit', 'reused', 'status']);

	const again = await request.post('/api/credits/claim', {
		data: { email: 'ana.builder@example.com' },
	});
	const againBody = (await again.json()) as { credit: string; reused: boolean };
	expect(againBody.credit).toBe(firstBody.credit);
	expect(againBody.reused).toBe(true);

	await page.getByLabel(/Correo con el que te registraste/i).fill('ana.builder@example.com');
	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByRole('button', { name: /Reclamar créditos/i }).click(),
	]);
	await expect(page.getByTestId('credits-success')).toBeVisible();
	await expect(page.getByTestId('credits-value')).toHaveText(firstBody.credit);
	await saveShot(page, 'credits_claim_registered.png');

	await page.getByLabel(/Correo con el que te registraste/i).fill('not.on.the.list@example.com');
	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByRole('button', { name: /Reclamar créditos/i }).click(),
	]);
	await expect(page.getByTestId('credits-not-registered')).toBeVisible();
	await expect(page.getByText(/Pasa con el equipo organizador al final del evento/i)).toBeVisible();
	await saveShot(page, 'credits_claim_not_registered.png');

	const pending = await request.post('/api/credits/claim', {
		data: { email: 'pending.person@example.com' },
	});
	expect((await pending.json()).status).toBe('not_registered');

	await page.goto('/creditos/admin');
	await expect(page.getByTestId('admin-login')).toBeVisible();
	await page.getByLabel(/Contraseña de organización/i).fill('wrong-password');
	await page.getByRole('button', { name: /^Entrar$/i }).click();
	await expect(page.getByText(/Esa contraseña no coincide/i)).toBeVisible();

	await page.getByLabel(/Contraseña de organización/i).fill('test-admin-password');
	await page.getByRole('button', { name: /^Entrar$/i }).click();
	await expect(page.getByTestId('admin-dashboard')).toBeVisible();
	await expect(page.getByTestId('admin-claimed')).toContainText('ana.builder@example.com');
	await expect(page.getByTestId('admin-unclaimed')).toContainText('bruno.guest@example.com');
	await expect(page.getByTestId('admin-failed')).toContainText('not.on.the.list@example.com');
	await saveShot(page, 'credits_admin.png');

	const origin = new URL(page.url()).origin;
	const exportGet = await page.request.get('/api/credits/admin/export?kind=claimed', {
		headers: { Origin: origin },
	});
	expect(exportGet.status()).toBe(405);

	const exportRes = await page.request.post('/api/credits/admin/export', {
		headers: { Origin: origin, 'Content-Type': 'application/json' },
		data: { kind: 'claimed' },
	});
	expect(exportRes.ok()).toBeTruthy();
	const csv = await exportRes.text();
	expect(csv).toContain('ana.builder@example.com');
	expect(csv).toContain('FAKE-GDL-001');
});
