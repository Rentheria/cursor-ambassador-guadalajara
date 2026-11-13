import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SCREEN_DIR = process.env.CREDITS_SCREENSHOT_DIR || path.join(process.cwd(), 'e2e/screenshots');
const ARTIFACTS_DIR = '/opt/cursor/artifacts';
const NEW_LINK = 'https://grok.com/refer/TEST-NEW-USER';
const EXISTING_LINK = 'https://cursor.com/redeem/event/TEST-EXISTING';

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

function htmlHasSecret(html: string): boolean {
	return (
		html.includes('TEST-NEW-USER') ||
		html.includes('TEST-EXISTING') ||
		html.includes(NEW_LINK) ||
		html.includes(EXISTING_LINK)
	);
}

test.describe.configure({ mode: 'serial' });

test('dual mode asks which account then reveals only that link', async ({ page, request }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/creditos');
	await page.evaluate(() => {
		localStorage.setItem('cursor-theme', 'light');
		document.documentElement.setAttribute('data-theme', 'light');
		document.documentElement.style.colorScheme = 'light';
	});

	const firstHtml = await page.content();
	expect(htmlHasSecret(firstHtml)).toBeFalsy();

	const unknown = await request.post('/api/credits/claim', {
		data: { email: 'not.on.the.list@example.com', path: 'new' },
	});
	const unknownBody = (await unknown.json()) as { status: string; credit?: string };
	expect(unknownBody.status).toBe('not_registered');
	expect(unknownBody.credit).toBeUndefined();
	expect(JSON.stringify(unknownBody)).not.toContain('TEST-NEW-USER');
	expect(JSON.stringify(unknownBody)).not.toContain('TEST-EXISTING');

	const pending = await request.post('/api/credits/claim', {
		data: { email: 'ana.builder@example.com' },
	});
	expect(pending.status()).toBe(200);
	const pendingBody = (await pending.json()) as {
		status: string;
		mode?: string;
		needsPath?: boolean;
		credit?: string;
	};
	expect(pendingBody).toEqual({ status: 'ok', mode: 'dual', needsPath: true, path: null, reused: false });
	expect(pendingBody.credit).toBeUndefined();

	await page.getByLabel(/Correo con el que te registraste/i).fill('ana.builder@example.com');
	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByRole('button', { name: /Reclamar créditos/i }).click(),
	]);
	await waitForMotions(page, 'credits-choose');
	await expect(page.getByText(/Ya tienes cuenta de Cursor\/Grok creada antes del 12 de octubre/i)).toBeVisible();
	expect(htmlHasSecret(await page.content())).toBeFalsy();
	await saveShot(page, 'credits_dual_choose.png');

	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByTestId('credits-path-new').click(),
	]);
	await waitForMotions(page, 'credits-success');
	await expect(page.getByTestId('credits-value')).toHaveText(NEW_LINK);
	await expect(page.getByText(EXISTING_LINK)).toHaveCount(0);
	await expect(page.getByText(/Entra o crea tu cuenta/i)).toBeVisible();
	await saveShot(page, 'credits_dual_new.png');

	await page.getByTestId('credits-switch-path').click();
	await waitForMotions(page, 'credits-choose');
	await Promise.all([
		page.waitForResponse((res) => res.url().includes('/api/credits/claim') && res.request().method() === 'POST'),
		page.getByTestId('credits-path-existing').click(),
	]);
	await waitForMotions(page, 'credits-success');
	await expect(page.getByTestId('credits-value')).toHaveText(EXISTING_LINK);
	await expect(page.getByText(NEW_LINK)).toHaveCount(0);
	await expect(page.getByText(/cuenta personal de Cursor/i)).toBeVisible();
	await saveShot(page, 'credits_dual_existing.png');

	const again = await request.post('/api/credits/claim', {
		data: { email: 'ana.builder@example.com' },
	});
	const againBody = (await again.json()) as { needsPath?: boolean; path?: string; credit?: string };
	expect(againBody.needsPath).toBe(true);
	expect(againBody.path).toBe('existing');
	expect(againBody.credit).toBeUndefined();

	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/creditos/admin');
	await page.getByLabel(/Contraseña de organización/i).fill('test-admin-password');
	await page.getByRole('button', { name: /^Entrar$/i }).click();
	await expect(page.getByTestId('admin-dashboard')).toBeVisible();
	await expect(page.getByTestId('admin-claimed')).toContainText('ana.builder@example.com');
	await expect(page.getByTestId('admin-claimed')).toContainText('Cuenta existente');
	await saveShot(page, 'credits_dual_admin.png');
});
