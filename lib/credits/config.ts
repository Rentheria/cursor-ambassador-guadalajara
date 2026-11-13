import 'server-only';

import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCreditPool, parseLumaGuestsCsv } from './csv';
import { createCreditsState } from './assign';
import type { CreditsMode, CreditsState } from './types';

export const CREDITS_CLAIM_PATH = '/creditos';
export const CREDITS_ADMIN_PATH = '/creditos/admin';
export const CREDITS_QR_PATH = '/creditos/qr';
export const ADMIN_COOKIE = 'credits_admin';
export const ADMIN_SESSION_HOURS = 12;

export type CreditsRuntimeConfig = {
	mode: CreditsMode;
	adminPassword: string;
	claimToken: string;
	storePath: string;
	kvUrl: string;
	kvToken: string;
	siteUrl: string;
};

function trimEnv(name: string): string {
	return (process.env[name] ?? '').trim();
}

export function getCreditsRuntimeConfig(): CreditsRuntimeConfig {
	const mode = trimEnv('CREDITS_MODE').toLowerCase() === 'shared' ? 'shared' : 'pool';
	const kvUrl = trimEnv('KV_REST_API_URL') || trimEnv('UPSTASH_REDIS_REST_URL');
	const kvToken = trimEnv('KV_REST_API_TOKEN') || trimEnv('UPSTASH_REDIS_REST_TOKEN');
	const storePath = trimEnv('CREDITS_STORE_PATH') || path.join(process.cwd(), '.data', 'credits-store.json');
	const siteUrl = (trimEnv('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000').replace(/\/$/, '');

	return {
		mode,
		adminPassword: trimEnv('CREDITS_ADMIN_PASSWORD'),
		claimToken: trimEnv('CREDITS_CLAIM_TOKEN'),
		storePath,
		kvUrl,
		kvToken,
		siteUrl,
	};
}

export function creditsStoreKind(): 'kv' | 'file' {
	const config = getCreditsRuntimeConfig();
	return config.kvUrl && config.kvToken ? 'kv' : 'file';
}

async function readOptionalFile(filePath: string): Promise<string> {
	if (!filePath) return '';
	try {
		return await readFile(filePath, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
		throw error;
	}
}

export async function bootstrapStateFromEnv(): Promise<CreditsState> {
	const config = getCreditsRuntimeConfig();
	const guestsCsv = trimEnv('CREDITS_GUESTS_CSV') || (await readOptionalFile(trimEnv('CREDITS_GUESTS_PATH')));
	const poolText = trimEnv('CREDITS_POOL') || (await readOptionalFile(trimEnv('CREDITS_POOL_PATH')));
	const sharedLink = trimEnv('CREDITS_SHARED_LINK');

	return createCreditsState({
		mode: config.mode,
		sharedLink,
		guests: guestsCsv ? parseLumaGuestsCsv(guestsCsv) : [],
		pool: poolText ? parseCreditPool(poolText) : [],
	});
}

export async function ensureStoreDir(filePath: string): Promise<void> {
	await mkdir(path.dirname(filePath), { recursive: true });
}

export function publicClaimUrl(): string {
	const { siteUrl, claimToken } = getCreditsRuntimeConfig();
	const url = `${siteUrl}${CREDITS_CLAIM_PATH}`;
	if (!claimToken) return url;
	return `${url}?k=${encodeURIComponent(claimToken)}`;
}
