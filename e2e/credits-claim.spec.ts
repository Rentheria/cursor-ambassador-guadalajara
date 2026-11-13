import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREEN_DIR = process.env.CREDITS_SCREENSHOT_DIR || path.join(process.cwd(), 'e2e/screenshots');
const ARTIFACTS_DIR = '/opt/cursor/artifacts';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

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

async function waitForMotions(page: Page, testId: string) {
	const loc = page.getByTestId(testId);
	await expect(loc).toBeVisible();
	await loc.evaluate(async (el) => {
		await Promise.all(
			el.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)),
		);
	});
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
	await page.evaluate((next) => {
		localStorage.setItem('cursor-theme', next);
		document.documentElement.setAttribute('data-theme', next);
		document.documentElement.style.colorScheme = next;
	}, theme);
}

test.describe.configure({ mode: 'serial' });

test('claim page: registered, not registered, and admin', async ({ page, request }) => {
	await page.setViewportSize(DESKTOP);
	await page.goto('/creditos');
	await setTheme(page, 'light');
	await expect(page.getByTestId('credits-hero')).toContainText(/Hackatón México/i);
	await expect(page.getByRole('heading', { name: /Reclama tus créditos de Cursor/i })).toBeVisible();
	await expect(page.getByText(/¿Organizas el evento/i)).toHaveCount(0);
	await expect(page.getByRole('link', { name: /Panel de organización/i })).toHaveCount(0);
	await expect(page.getByRole('navigation').getByRole('link', { name: /créditos|credits/i })).toHaveCount(0);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);

	const home = await page.goto('/');
	expect(home?.ok()).toBeTruthy();
	await expect(page.getByRole('navigation').getByRole('link', { name: /créditos|credits/i })).toHaveCount(0);
	await expect(page.getByRole('link', { name: /Reclamar créditos/i })).toHaveCount(0);
	const homeHtml = await page.content();
	expect(homeHtml).not.toMatch(/href="\/creditos"/i);

	const sitemap = await request.get('/sitemap.xml');
	const sitemapBody = await sitemap.text();
	expect(sitemapBody).not.toContain('/creditos');
	expect(sitemapBody).not.toContain('/claim');

	const robots = await request.get('/robots.txt');
	const robotsBody = await robots.text();
	expect(robotsBody).toMatch(/Disallow:\s*\/creditos/i);
	expect(robotsBody).toMatch(/Disallow:\s*\/claim/i);

	await page.goto('/creditos');
	await setTheme(page, 'light');
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
	await waitForMotions(page, 'credits-success');
	await expect(page.getByTestId('credits-form')).toHaveCount(0);
	await expect(page.getByRole('button', { name: /Reclamar créditos/i })).toHaveCount(0);
	await expect(page.getByTestId('credits-value')).toHaveText(firstBody.credit);
	await expect(page.getByTestId('credits-copy')).toBeVisible();
	await expect(page.getByRole('heading', { name: /Estos son tus créditos/i })).toBeFocused();
	await saveShot(page, 'credits_claim_registered.png');

	await page.goto('/creditos');
	await page.getByLabel(/Correo con el que te registraste/i).fill('not.on.the.list@example.com');
	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByRole('button', { name: /Reclamar créditos/i }).click(),
	]);
	await waitForMotions(page, 'credits-not-registered');
	await expect(page.getByTestId('credits-form')).toHaveCount(0);
	await expect(page.getByText(/Pasa con el equipo organizador al final del evento/i)).toBeVisible();
	await expect(page.getByRole('heading', { name: /No encontramos ese correo/i })).toBeFocused();
	await expect(page.getByTestId('credits-try-another')).toBeVisible();
	await saveShot(page, 'credits_claim_not_registered.png');

	await page.getByTestId('credits-try-another').click();
	await waitForMotions(page, 'credits-form');
	await expect(page.getByLabel(/Correo con el que te registraste/i)).toBeVisible();
	await expect(page.getByLabel(/Correo con el que te registraste/i)).toBeFocused();

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

test('claim and QR screenshots: mobile + desktop, light + dark', async ({ page }) => {
	const shots: Array<{
		name: string;
		viewport: typeof MOBILE | typeof DESKTOP;
		theme: 'light' | 'dark';
		path: string;
		prepare: (page: Page) => Promise<void>;
	}> = [
		{
			name: 'form mobile light',
			viewport: MOBILE,
			theme: 'light',
			path: 'credits_claim_form_mobile_light.png',
			prepare: async (p) => {
				await p.goto('/creditos');
			},
		},
		{
			name: 'form mobile dark',
			viewport: MOBILE,
			theme: 'dark',
			path: 'credits_claim_form_mobile_dark.png',
			prepare: async (p) => {
				await p.goto('/creditos');
			},
		},
		{
			name: 'form desktop light',
			viewport: DESKTOP,
			theme: 'light',
			path: 'credits_claim_form_desktop_light.png',
			prepare: async (p) => {
				await p.goto('/creditos');
			},
		},
		{
			name: 'form desktop dark',
			viewport: DESKTOP,
			theme: 'dark',
			path: 'credits_claim_form_desktop_dark.png',
			prepare: async (p) => {
				await p.goto('/creditos');
			},
		},
	];

	for (const shot of shots) {
		await page.setViewportSize(shot.viewport);
		await shot.prepare(page);
		await setTheme(page, shot.theme);
		await expect(page.getByTestId('credits-hero')).toBeVisible();
		await saveShot(page, shot.path);
	}

	await page.setViewportSize(MOBILE);
	await page.goto('/creditos');
	await setTheme(page, 'light');
	await page.getByLabel(/Correo con el que te registraste/i).fill('ana.builder@example.com');
	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByRole('button', { name: /Reclamar créditos/i }).click(),
	]);
	await waitForMotions(page, 'credits-success');
	await expect(page.getByTestId('credits-form')).toHaveCount(0);
	await saveShot(page, 'credits_claim_registered_mobile_light.png');

	await page.setViewportSize(DESKTOP);
	await setTheme(page, 'dark');
	await saveShot(page, 'credits_claim_registered_desktop_dark.png');

	await page.setViewportSize(MOBILE);
	await setTheme(page, 'dark');
	await page.goto('/creditos');
	await setTheme(page, 'dark');
	await page.getByLabel(/Correo con el que te registraste/i).fill('not.on.the.list@example.com');
	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByRole('button', { name: /Reclamar créditos/i }).click(),
	]);
	await waitForMotions(page, 'credits-not-registered');
	await expect(page.getByTestId('credits-try-another')).toBeVisible();
	await saveShot(page, 'credits_claim_not_registered_mobile_dark.png');

	await page.setViewportSize(DESKTOP);
	await setTheme(page, 'light');
	await saveShot(page, 'credits_claim_not_registered_desktop_light.png');

	await page.goto('/creditos/admin');
	await page.getByLabel(/Contraseña de organización/i).fill('test-admin-password');
	await page.getByRole('button', { name: /^Entrar$/i }).click();
	await expect(page.getByTestId('admin-dashboard')).toBeVisible();

	await page.goto('/creditos/qr');
	await expect(page.getByRole('heading', { name: /Hackatón México/i })).toBeVisible();
	await setTheme(page, 'light');
	await page.setViewportSize(DESKTOP);
	await saveShot(page, 'credits_qr_desktop_light.png');
	await setTheme(page, 'dark');
	await saveShot(page, 'credits_qr_desktop_dark.png');
	await page.setViewportSize(MOBILE);
	await setTheme(page, 'light');
	await saveShot(page, 'credits_qr_mobile_light.png');
	await setTheme(page, 'dark');
	await saveShot(page, 'credits_qr_mobile_dark.png');
});
