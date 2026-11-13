import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { claimCredit, createCreditsState, publicClaimPayload, remainingCredits, unclaimedGuests } from './assign';
import { parseCreditsMode } from './types';
import {
	escapeCsvCell,
	isEligibleApprovalStatus,
	parseCreditPool,
	parseCsvRows,
	parseLumaGuestsCsv,
	toCsv,
} from './csv';
import { emailsMatch, normalizeEmail } from './email';
import { CLAIM_MESSAGE_KEYS, claimUiPhase, isClaimMessageStatus } from './claim-ui';
import { cookieSecureFromRequest, isSameOriginRequest, qrPosterAllowed } from './origin';
import { clientKeyFromRequest, consumeRateLimit, resetRateLimitForTests } from './rate-limit';
import { evaluateClaimWindow, formatClaimMoment, getClaimWindowSnapshot, parseClaimInstant } from './window';

const sampleCsv = readFileSync(path.join(process.cwd(), 'fixtures/credits/luma-guests.sample.csv'), 'utf8');
const samplePool = readFileSync(path.join(process.cwd(), 'fixtures/credits/codes.sample.txt'), 'utf8');

describe('normalizeEmail', () => {
	it('trims and lowercases', () => {
		assert.equal(normalizeEmail('  Ana.Builder@Example.COM '), 'ana.builder@example.com');
	});

	it('rejects empty or malformed values', () => {
		assert.equal(normalizeEmail(''), null);
		assert.equal(normalizeEmail('not-an-email'), null);
		assert.equal(normalizeEmail('a@b'), null);
		assert.equal(normalizeEmail(null), null);
	});

	it('matches emails case-insensitively', () => {
		assert.equal(emailsMatch('Ana.Builder@example.com', 'ana.builder@EXAMPLE.com'), true);
		assert.equal(emailsMatch('ana.builder@example.com', 'bruno.guest@example.com'), false);
	});
});

describe('Luma CSV parsing', () => {
	it('reads standard Luma guest columns and quoted commas', () => {
		const guests = parseLumaGuestsCsv(sampleCsv);
		assert.equal(guests.length, 6);
		const quoted = guests.find((guest) => guest.email === 'quoted.name@example.com');
		assert.equal(quoted?.name, 'Quoted, Name');
		assert.equal(quoted?.eligible, true);
	});

	it('treats approved and going as eligible, pending and declined as not', () => {
		const guests = parseLumaGuestsCsv(sampleCsv);
		const byEmail = Object.fromEntries(guests.map((guest) => [guest.email, guest]));
		assert.equal(byEmail['ana.builder@example.com']?.eligible, true);
		assert.equal(byEmail['camilo.plus@example.com']?.eligible, true);
		assert.equal(byEmail['pending.person@example.com']?.eligible, false);
		assert.equal(byEmail['declined.dev@example.com']?.eligible, false);
	});

	it('accepts empty approval_status as registered', () => {
		const csv = 'name,email,approval_status\nSam Sample,sam.sample@example.com,\n';
		const guests = parseLumaGuestsCsv(csv);
		assert.equal(guests[0]?.eligible, true);
		assert.equal(isEligibleApprovalStatus(''), true);
		assert.equal(isEligibleApprovalStatus('waitlist'), false);
	});

	it('builds a name from first_name and last_name when name is missing', () => {
		const csv = 'first_name,last_name,email\nLila,Neri,lila.neri@example.com\n';
		const guests = parseLumaGuestsCsv(csv);
		assert.equal(guests[0]?.name, 'Lila Neri');
	});

	it('strips a UTF-8 BOM and maps Email / Approval Status headers', () => {
		const csv = '\uFEFFName,Email,Approval Status\nPat,pat.guest@example.com,Approved\n';
		const guests = parseLumaGuestsCsv(csv);
		assert.equal(guests[0]?.email, 'pat.guest@example.com');
		assert.equal(guests[0]?.eligible, true);
	});

	it('treats Luma approved / declined / pending_approval from a BOM-prefixed export', () => {
		const csv =
			'\uFEFFname,email,approval_status\n' +
			'Ana Approved,ana.approved@example.com,approved\n' +
			'Dana Declined,dana.declined@example.com,declined\n' +
			'Pat Pending,pat.pending@example.com,pending_approval\n';
		const guests = parseLumaGuestsCsv(csv);
		const byEmail = Object.fromEntries(guests.map((guest) => [guest.email, guest]));
		assert.equal(guests.length, 3);
		assert.equal(byEmail['ana.approved@example.com']?.eligible, true);
		assert.equal(byEmail['ana.approved@example.com']?.approvalStatus, 'approved');
		assert.equal(byEmail['dana.declined@example.com']?.eligible, false);
		assert.equal(byEmail['dana.declined@example.com']?.approvalStatus, 'declined');
		assert.equal(byEmail['pat.pending@example.com']?.eligible, false);
		assert.equal(byEmail['pat.pending@example.com']?.approvalStatus, 'pending_approval');
		assert.equal(isEligibleApprovalStatus('pending_approval'), false);
		assert.equal(isEligibleApprovalStatus('pending-approval'), false);
		assert.equal(isEligibleApprovalStatus('approved'), true);
		assert.equal(isEligibleApprovalStatus('declined'), false);
	});

	it('parses quoted CSV rows', () => {
		const rows = parseCsvRows('name,email\n"Builder, Ana",ana.builder@example.com\n');
		assert.deepEqual(rows[1], ['Builder, Ana', 'ana.builder@example.com']);
	});

	it('throws when the email column is missing', () => {
		assert.throws(() => parseLumaGuestsCsv('name,status\nAda,approved\n'), /email column/);
	});

	it('skips comments and duplicates in the credit pool', () => {
		assert.deepEqual(parseCreditPool(samplePool), [
			'https://cursor.com/referral?code=FAKE-GDL-001',
			'https://cursor.com/referral?code=FAKE-GDL-002',
			'CURSOR-GDL-TEST-003',
		]);
	});

	it('neutralizes formula-like cells in CSV exports', () => {
		assert.equal(escapeCsvCell('=CMD'), '"\'=CMD"');
		assert.equal(escapeCsvCell('+cmd'), '"\'+cmd"');
		assert.equal(escapeCsvCell('@SUM(1)'), '"\'@SUM(1)"');
		assert.equal(escapeCsvCell('-1'), '"\'-1"');
		assert.equal(toCsv([['=CMD', 'safe']]), '"\'=CMD",safe');
	});
});

describe('code assignment', () => {
	const guests = parseLumaGuestsCsv(sampleCsv);
	const pool = parseCreditPool(samplePool);
	const now = new Date('2026-11-14T17:00:00.000Z');

	it('assigns the next unique code and returns the same one on re-claim', () => {
		const start = createCreditsState({ mode: 'pool', guests, pool });
		const first = claimCredit(start, '  ANA.BUILDER@example.com ', now);
		assert.equal(first.result.status, 'ok');
		assert.equal(first.result.status === 'ok' && first.result.reused, false);
		assert.equal(first.result.status === 'ok' && first.result.credit, 'https://cursor.com/referral?code=FAKE-GDL-001');

		const second = claimCredit(first.state, 'ana.builder@example.com', now);
		assert.equal(second.result.status, 'ok');
		assert.equal(second.result.status === 'ok' && second.result.reused, true);
		assert.equal(
			second.result.status === 'ok' && second.result.credit,
			'https://cursor.com/referral?code=FAKE-GDL-001',
		);
		assert.equal(second.state.pool.length, 2);
		assert.equal(second.state.assignments.length, 1);
	});

	it('gives a different code to a second eligible email', () => {
		const start = createCreditsState({ mode: 'pool', guests, pool });
		const first = claimCredit(start, 'ana.builder@example.com', now);
		const second = claimCredit(first.state, 'bruno.guest@example.com', now);
		assert.equal(
			second.result.status === 'ok' && second.result.credit,
			'https://cursor.com/referral?code=FAKE-GDL-002',
		);
	});

	it('returns not_registered for unknown, pending, and declined emails', () => {
		const start = createCreditsState({ mode: 'pool', guests, pool });
		assert.equal(claimCredit(start, 'stranger@example.com', now).result.status, 'not_registered');
		assert.equal(claimCredit(start, 'pending.person@example.com', now).result.status, 'not_registered');
		assert.equal(claimCredit(start, 'declined.dev@example.com', now).result.status, 'not_registered');
	});

	it('exhausts the pool after unique codes run out', () => {
		let state = createCreditsState({ mode: 'pool', guests, pool: ['ONLY-ONE'] });
		state = claimCredit(state, 'ana.builder@example.com', now).state;
		const exhausted = claimCredit(state, 'bruno.guest@example.com', now);
		assert.equal(exhausted.result.status, 'exhausted');
		assert.equal(remainingCredits(exhausted.state), 0);
	});

	it('shared mode returns the same link to every eligible email', () => {
		const start = createCreditsState({
			mode: 'shared',
			guests,
			sharedLink: 'https://cursor.com/referral?code=SHARED-FAKE',
		});
		const first = claimCredit(start, 'ana.builder@example.com', now);
		const second = claimCredit(first.state, 'bruno.guest@example.com', now);
		assert.equal(first.result.status === 'ok' && first.result.credit, 'https://cursor.com/referral?code=SHARED-FAKE');
		assert.equal(second.result.status === 'ok' && second.result.credit, 'https://cursor.com/referral?code=SHARED-FAKE');
		assert.equal(unclaimedGuests(second.state).length, 2);
	});

	it('is unavailable until guests are loaded', () => {
		const start = createCreditsState({ mode: 'pool', pool });
		assert.equal(claimCredit(start, 'ana.builder@example.com', now).result.status, 'unavailable');
	});

	it('caps stored invalid emails at 254 characters', () => {
		const start = createCreditsState({ mode: 'pool', guests, pool });
		const huge = `${'a'.repeat(400)} not-an-email`;
		const next = claimCredit(start, huge, now);
		assert.equal(next.result.status, 'invalid');
		assert.equal(next.state.failedAttempts[0]?.email.length, 254);
	});

	it('dual mode asks for a path and only then returns that link', () => {
		const start = createCreditsState({
			mode: 'dual',
			guests,
			linkNewUsers: 'https://grok.com/refer/TEST-NEW-USER',
			linkExistingUsers: 'https://cursor.com/redeem/event/TEST-EXISTING',
		});
		const pending = claimCredit(start, 'ana.builder@example.com', now);
		assert.equal(pending.result.status, 'ok');
		assert.equal(pending.result.status === 'ok' && pending.result.needsPath, true);
		assert.equal(pending.result.status === 'ok' && pending.result.credit, undefined);
		assert.equal(pending.state.assignments[0]?.path, null);
		assert.equal(pending.state.assignments[0]?.credit, '');

		const chosen = claimCredit(pending.state, 'ana.builder@example.com', now, 'new');
		assert.equal(chosen.result.status, 'ok');
		assert.equal(chosen.result.status === 'ok' && chosen.result.credit, 'https://grok.com/refer/TEST-NEW-USER');
		assert.equal(chosen.result.status === 'ok' && chosen.result.path, 'new');
		assert.equal(chosen.result.status === 'ok' && chosen.result.reused, true);

		const switched = claimCredit(chosen.state, 'ANA.BUILDER@example.com', now, 'existing');
		assert.equal(
			switched.result.status === 'ok' && switched.result.credit,
			'https://cursor.com/redeem/event/TEST-EXISTING',
		);
		assert.equal(switched.state.assignments[0]?.path, 'existing');
		assert.equal(switched.state.assignments.length, 1);
	});

	it('dual mode does not give a link to ineligible emails', () => {
		const start = createCreditsState({
			mode: 'dual',
			guests,
			linkNewUsers: 'https://grok.com/refer/TEST-NEW-USER',
			linkExistingUsers: 'https://cursor.com/redeem/event/TEST-EXISTING',
		});
		const unknown = claimCredit(start, 'stranger@example.com', now, 'new');
		assert.equal(unknown.result.status, 'not_registered');
		assert.equal(unknown.result.credit, undefined);
		assert.equal(unknown.state.assignments.length, 0);
	});

	it('keeps dual links off the public payload until a path is chosen', () => {
		const start = createCreditsState({
			mode: 'dual',
			guests,
			linkNewUsers: 'https://grok.com/refer/TEST-NEW-USER',
			linkExistingUsers: 'https://cursor.com/redeem/event/TEST-EXISTING',
		});
		const pending = publicClaimPayload(claimCredit(start, 'ana.builder@example.com', now).result);
		assert.equal(pending.status, 'ok');
		assert.equal('credit' in pending, false);
		assert.equal(JSON.stringify(pending).includes('grok.com'), false);
		assert.equal(JSON.stringify(pending).includes('redeem/event'), false);

		const chosen = publicClaimPayload(claimCredit(start, 'ana.builder@example.com', now, 'new').result);
		assert.equal(chosen.credit, 'https://grok.com/refer/TEST-NEW-USER');
		assert.equal(JSON.stringify(chosen).includes('TEST-EXISTING'), false);
	});
});

describe('credits mode', () => {
	it('parses pool, shared, and dual', () => {
		assert.equal(parseCreditsMode('dual'), 'dual');
		assert.equal(parseCreditsMode('SHARED'), 'shared');
		assert.equal(parseCreditsMode(''), 'pool');
	});
});

describe('claim UI phase', () => {
	it('keeps the form until a response arrives', () => {
		assert.equal(claimUiPhase(null), 'form');
		assert.equal(claimUiPhase(undefined), 'form');
	});

	it('replaces the form with a success screen or a message screen', () => {
		assert.equal(claimUiPhase('ok'), 'success');
		assert.equal(claimUiPhase('not_registered'), 'message');
		assert.equal(claimUiPhase('exhausted'), 'message');
		assert.equal(claimUiPhase('invalid'), 'message');
		assert.equal(claimUiPhase('rate_limited'), 'message');
		assert.equal(claimUiPhase('unavailable'), 'message');
		assert.equal(claimUiPhase('forbidden'), 'message');
	});

	it('shows the dual path picker before a link', () => {
		assert.equal(claimUiPhase('ok', { needsPath: true }), 'choose');
	});

	it('has copy keys for every non-success outcome', () => {
		const statuses = ['not_registered', 'exhausted', 'invalid', 'rate_limited', 'unavailable', 'forbidden'] as const;
		for (const status of statuses) {
			assert.equal(isClaimMessageStatus(status), true);
			assert.ok(CLAIM_MESSAGE_KEYS[status].heading.startsWith('credits.'));
			assert.ok(CLAIM_MESSAGE_KEYS[status].body.startsWith('credits.'));
			assert.ok(CLAIM_MESSAGE_KEYS[status].testId.startsWith('credits-'));
		}
		assert.equal(isClaimMessageStatus('ok'), false);
	});
});

describe('rate limit', () => {
	it('allows a burst then blocks the same key', () => {
		resetRateLimitForTests();
		const now = 1_000_000;
		for (let i = 0; i < 8; i += 1) {
			assert.equal(consumeRateLimit('ip-1', now + i).ok, true);
		}
		const blocked = consumeRateLimit('ip-1', now + 9);
		assert.equal(blocked.ok, false);
		assert.equal(consumeRateLimit('ip-2', now).ok, true);
	});

	it('ignores client-supplied X-Forwarded-For without a platform IP header', () => {
		const spoofed = new Request('http://localhost/api/credits/claim', {
			headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
		});
		assert.equal(clientKeyFromRequest(spoofed), 'direct');

		const vercel = new Request('http://localhost/api/credits/claim', {
			headers: {
				'x-forwarded-for': '203.0.113.9',
				'x-vercel-forwarded-for': '198.51.100.20',
			},
		});
		assert.equal(clientKeyFromRequest(vercel, { VERCEL: '1' }), '198.51.100.20');
		assert.equal(clientKeyFromRequest(vercel), 'direct');

		const realIp = new Request('http://localhost/api/credits/claim', {
			headers: { 'x-real-ip': '192.0.2.44' },
		});
		assert.equal(clientKeyFromRequest(realIp), 'direct');
		assert.equal(clientKeyFromRequest(realIp, { CREDITS_TRUST_PROXY: 'nginx' }), '192.0.2.44');
	});
});

describe('admin origin', () => {
	it('accepts same-origin Origin and rejects a foreign Origin', () => {
		const ok = new Request('http://localhost:3011/api/credits/admin', {
			headers: { host: 'localhost:3011', origin: 'http://localhost:3011' },
		});
		assert.equal(isSameOriginRequest(ok), true);

		const cross = new Request('http://localhost:3011/api/credits/admin', {
			headers: {
				host: 'localhost:3011',
				origin: 'https://evil.example',
			},
		});
		assert.equal(isSameOriginRequest(cross), false);
	});

	it('sets Secure from the request scheme, not from SITE_URL', () => {
		const https = new Request('https://cursorguadalajara.com/api/credits/admin/login', {
			headers: { 'x-forwarded-proto': 'https' },
		});
		assert.equal(cookieSecureFromRequest(https), true);

		const http = new Request('http://127.0.0.1:3011/api/credits/admin/login', {
			headers: { 'x-forwarded-proto': 'http' },
		});
		assert.equal(cookieSecureFromRequest(http), false);
	});

	it('refuses to print a claim-token QR when organizer login is not configured', () => {
		assert.equal(qrPosterAllowed('', 'on-site-secret'), false);
		assert.equal(qrPosterAllowed('password', 'on-site-secret'), true);
		assert.equal(qrPosterAllowed('password', ''), true);
		assert.equal(qrPosterAllowed('', ''), true);
	});
});

describe('claim window', () => {
	const open = new Date('2026-11-14T10:00:00-06:00');
	const close = new Date('2026-11-14T22:00:00-06:00');

	it('treats missing or invalid instants as unset', () => {
		assert.equal(parseClaimInstant(undefined), null);
		assert.equal(parseClaimInstant(''), null);
		assert.equal(parseClaimInstant('   '), null);
		assert.equal(parseClaimInstant('not-a-date'), null);
	});

	it('is open when both bounds are unset', () => {
		assert.equal(evaluateClaimWindow(new Date('2020-01-01T00:00:00Z'), null, null), 'open');
	});

	it('is not_open before CREDITS_OPEN_AT and open at/after it', () => {
		assert.equal(evaluateClaimWindow(new Date('2026-11-14T09:59:59-06:00'), open, null), 'not_open');
		assert.equal(evaluateClaimWindow(open, open, null), 'open');
		assert.equal(evaluateClaimWindow(new Date('2026-11-14T10:00:01-06:00'), open, null), 'open');
	});

	it('is closed at/after CREDITS_CLOSE_AT', () => {
		assert.equal(evaluateClaimWindow(new Date('2026-11-14T21:59:59-06:00'), open, close), 'open');
		assert.equal(evaluateClaimWindow(close, open, close), 'closed');
		assert.equal(evaluateClaimWindow(new Date('2026-11-15T00:00:00-06:00'), null, close), 'closed');
	});

	it('ignores a close instant that is not after open', () => {
		assert.equal(evaluateClaimWindow(new Date('2026-11-14T12:00:00-06:00'), open, open), 'open');
		assert.equal(evaluateClaimWindow(new Date('2026-11-14T09:00:00-06:00'), open, open), 'not_open');
	});

	it('reads env through getClaimWindowSnapshot without assigning a code', () => {
		const before = getClaimWindowSnapshot(new Date('2026-11-14T09:00:00-06:00'), '2026-11-14T10:00:00-06:00', '');
		assert.equal(before.status, 'not_open');
		assert.ok(before.openAt);

		const after = getClaimWindowSnapshot(
			new Date('2026-11-14T23:00:00-06:00'),
			'2026-11-14T10:00:00-06:00',
			'2026-11-14T22:00:00-06:00',
		);
		assert.equal(after.status, 'closed');

		const unset = getClaimWindowSnapshot(new Date('2026-11-14T09:00:00-06:00'), '', '');
		assert.equal(unset.status, 'open');
		assert.equal(unset.openAt, null);
		assert.equal(unset.closeAt, null);
	});

	it('formats the Guadalajara kickoff moment in Spanish', () => {
		assert.equal(formatClaimMoment(open, 'es-MX'), 'sábado 14 de nov a las 10:00');
	});
});
