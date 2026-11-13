import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { claimCredit, createCreditsState, remainingCredits, unclaimedGuests } from './assign';
import { isEligibleApprovalStatus, parseCreditPool, parseCsvRows, parseLumaGuestsCsv } from './csv';
import { emailsMatch, normalizeEmail } from './email';
import { consumeRateLimit, resetRateLimitForTests } from './rate-limit';

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
});
