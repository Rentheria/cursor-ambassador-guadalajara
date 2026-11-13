import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS, getCreditsRuntimeConfig } from './config';

function hmac(secret: string, payload: string): string {
	return createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}

export function passwordConfigured(): boolean {
	return Boolean(getCreditsRuntimeConfig().adminPassword);
}

export function verifyAdminPassword(candidate: string): boolean {
	const expected = getCreditsRuntimeConfig().adminPassword;
	if (!expected || !candidate) return false;
	return safeEqual(hmac('credits-admin', expected), hmac('credits-admin', candidate));
}

export function createAdminToken(now = Date.now()): string {
	const secret = getCreditsRuntimeConfig().adminPassword;
	const exp = now + ADMIN_SESSION_HOURS * 60 * 60 * 1000;
	const payload = `admin:${exp}`;
	return `${exp}.${hmac(secret, payload)}`;
}

export function verifyAdminToken(token: string | undefined, now = Date.now()): boolean {
	if (!token || !passwordConfigured()) return false;
	const [expRaw, signature] = token.split('.');
	const exp = Number(expRaw);
	if (!expRaw || !signature || Number.isNaN(exp) || exp < now) return false;
	const secret = getCreditsRuntimeConfig().adminPassword;
	const expected = hmac(secret, `admin:${exp}`);
	return safeEqual(expected, signature);
}

export function readAdminToken(request: Request): string | undefined {
	const cookie = request.headers.get('cookie') ?? '';
	const match = cookie.split(/;\s*/).find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
	if (!match) return undefined;
	return decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1));
}

export function isAdminRequest(request: Request): boolean {
	const bearer = request.headers.get('authorization');
	if (bearer?.toLowerCase().startsWith('bearer ')) {
		const token = bearer.slice(7).trim();
		if (verifyAdminPassword(token) || verifyAdminToken(token)) return true;
	}
	return verifyAdminToken(readAdminToken(request));
}

export function unauthorized(): NextResponse {
	return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

function cookieSecure(): boolean {
	return getCreditsRuntimeConfig().siteUrl.startsWith('https://');
}

export function attachAdminCookie(response: NextResponse, token: string): NextResponse {
	response.cookies.set(ADMIN_COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: cookieSecure(),
		path: '/',
		maxAge: ADMIN_SESSION_HOURS * 60 * 60,
	});
	return response;
}

export function clearAdminCookie(response: NextResponse): NextResponse {
	response.cookies.set(ADMIN_COOKIE, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: cookieSecure(),
		path: '/',
		maxAge: 0,
	});
	return response;
}
