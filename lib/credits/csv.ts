import { normalizeEmail } from './email';
import type { Guest } from './types';

const ELIGIBLE_STATUSES = new Set(['approved', 'going', 'registered', 'attended', 'checked_in', 'checked-in', 'yes']);

const INELIGIBLE_STATUSES = new Set([
	'pending',
	'declined',
	'rejected',
	'waitlist',
	'waitlisted',
	'invited',
	'cancelled',
	'canceled',
	'no-show',
	'noshow',
	'no_show',
]);

function stripBom(input: string): string {
	return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

/** RFC 4180-ish CSV row parser (quoted fields, doubled quotes, commas). */
export function parseCsvRows(text: string): string[][] {
	const source = stripBom(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let i = 0; i < source.length; i += 1) {
		const char = source[i];
		const next = source[i + 1];

		if (inQuotes) {
			if (char === '"' && next === '"') {
				field += '"';
				i += 1;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
			continue;
		}
		if (char === ',') {
			row.push(field);
			field = '';
			continue;
		}
		if (char === '\n') {
			row.push(field);
			field = '';
			if (row.some((cell) => cell.trim() !== '')) rows.push(row);
			row = [];
			continue;
		}
		field += char;
	}

	row.push(field);
	if (row.some((cell) => cell.trim() !== '')) rows.push(row);
	return rows;
}

function normalizeHeader(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/^\ufeff/, '')
		.replace(/[\s-]+/g, '_');
}

function pickColumn(headers: string[], aliases: string[]): number {
	for (const alias of aliases) {
		const index = headers.indexOf(alias);
		if (index !== -1) return index;
	}
	return -1;
}

export function isEligibleApprovalStatus(status: string | undefined): boolean {
	const normalized = (status ?? '').trim().toLowerCase();
	if (!normalized) return true;
	if (INELIGIBLE_STATUSES.has(normalized)) return false;
	if (ELIGIBLE_STATUSES.has(normalized)) return true;
	return false;
}

function guestName(row: string[], nameIndex: number, firstIndex: number, lastIndex: number): string {
	if (nameIndex >= 0 && row[nameIndex]?.trim()) return row[nameIndex].trim();
	const first = firstIndex >= 0 ? row[firstIndex]?.trim() : '';
	const last = lastIndex >= 0 ? row[lastIndex]?.trim() : '';
	return [first, last].filter(Boolean).join(' ').trim();
}

/**
 * Parse a Luma guests export (CSV or the text of an Excel-exported CSV).
 * Looks up `email`, `name` / `first_name`+`last_name`, and `approval_status`.
 */
export function parseLumaGuestsCsv(text: string): Guest[] {
	const rows = parseCsvRows(text);
	if (rows.length < 2) return [];

	const headers = rows[0].map(normalizeHeader);
	const emailIndex = pickColumn(headers, ['email', 'email_address', 'guest_email']);
	if (emailIndex < 0) {
		throw new Error('Luma CSV must include an email column');
	}

	const nameIndex = pickColumn(headers, ['name', 'full_name', 'guest_name']);
	const firstIndex = pickColumn(headers, ['first_name', 'firstname']);
	const lastIndex = pickColumn(headers, ['last_name', 'lastname']);
	const statusIndex = pickColumn(headers, ['approval_status', 'approvalstatus', 'status', 'rsvp_status']);

	const byEmail = new Map<string, Guest>();

	for (const row of rows.slice(1)) {
		const email = normalizeEmail(row[emailIndex] ?? '');
		if (!email) continue;

		const approvalStatus = (statusIndex >= 0 ? row[statusIndex] : '')?.trim() ?? '';
		const eligible = isEligibleApprovalStatus(approvalStatus);
		const existing = byEmail.get(email);
		if (existing) {
			if (eligible && !existing.eligible) {
				byEmail.set(email, {
					...existing,
					eligible: true,
					approvalStatus: approvalStatus || existing.approvalStatus,
					name: existing.name || guestName(row, nameIndex, firstIndex, lastIndex),
				});
			}
			continue;
		}

		byEmail.set(email, {
			email,
			name: guestName(row, nameIndex, firstIndex, lastIndex),
			approvalStatus,
			eligible,
		});
	}

	return Array.from(byEmail.values());
}

/** One code or URL per line. Empty lines and `#` comments are ignored. */
export function parseCreditPool(text: string): string[] {
	const seen = new Set<string>();
	const pool: string[] = [];
	for (const line of text.split(/\r?\n/)) {
		const value = line.trim();
		if (!value || value.startsWith('#')) continue;
		if (seen.has(value)) continue;
		seen.add(value);
		pool.push(value);
	}
	return pool;
}

export function toCsv(rows: string[][]): string {
	return rows
		.map((row) =>
			row
				.map((cell) => {
					const value = cell ?? '';
					if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
					return value;
				})
				.join(','),
		)
		.join('\n');
}
