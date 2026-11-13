import type { CursorEvent } from '@/lib/types';

export type EventDateGroup = {
	key: string;
	label: string;
	events: CursorEvent[];
};

function formatDate(date: string, locale: string) {
	const parsed = new Date(`${date}T12:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return date;

	return new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(parsed);
}

export function groupEventsByDate(events: CursorEvent[], locale = 'en'): EventDateGroup[] {
	const groups = new Map<string, CursorEvent[]>();

	for (const event of [...events].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))) {
		const key = event.date ?? 'upcoming';
		const current = groups.get(key) ?? [];
		current.push(event);
		groups.set(key, current);
	}

	return Array.from(groups, ([key, groupedEvents]) => ({
		key,
		label: key === 'upcoming' ? 'Upcoming' : formatDate(key, locale),
		events: groupedEvents,
	}));
}
