import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS, getCreditsRuntimeConfig } from './config';
import { cookieSecureFromRequest, isSameOriginRequest } from './origin';

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

function hasBearerAdmin(request: Request): boolean {
	const bearer = request.headers.get('authorization');
	if (!bearer?.toLowerCase().startsWith('bearer ')) return false;
	const token = bearer.slice(7).trim();
	return verifyAdminPassword(token) || verifyAdminToken(token);
}

export function isAdminRequest(request: Request): boolean {
	if (hasBearerAdmin(request)) return true;
	if (!verifyAdminToken(readAdminToken(request))) return false;
	return isSameOriginRequest(request);
}

export function unauthorized(): NextResponse {
	return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export function verifyClaimToken(candidate: string | null | undefined): boolean {
	const expected = getCreditsRuntimeConfig().claimToken;
	if (!expected) return true;
	if (!candidate) return false;
	return safeEqual(hmac('credits-claim', expected), hmac('credits-claim', candidate));
}

export function attachAdminCookie(response: NextResponse, token: string, request: Request): NextResponse {
	response.cookies.set(ADMIN_COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: cookieSecureFromRequest(request),
		path: '/',
		maxAge: ADMIN_SESSION_HOURS * 60 * 60,
	});
	return response;
}

export function clearAdminCookie(response: NextResponse, request: Request): NextResponse {
	response.cookies.set(ADMIN_COOKIE, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: cookieSecureFromRequest(request),
		path: '/',
		maxAge: 0,
	});
	return response;
}
