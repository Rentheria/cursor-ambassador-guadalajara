import { CursorEvent } from '@/lib/types';

export const events: CursorEvent[] = [
	{
		id: 'hackaton-mexico-gdl-2026',
		title: 'Cursor Hackatón México: Guadalajara',
		date: '2026-11-14',
		displayDate: '14 de noviembre de 2026',
		location: 'HackerGarage, Colonia Americana, Guadalajara',
		lumaUrl: 'https://luma.com/k07swqi7',
		status: 'upcoming',
	},
	{
		id: 'cafe-cursor-gdl-2026-04',
		title: 'Cafe Cursor Guadalajara',
		date: '2026-04-25',
		displayDate: '25 de abril de 2026',
		attendees: 55,
		location: 'Guadalajara, México',
		thumbnail: '/images/events/placeholder-01.jpg',
		galleryImages: ['/images/events/placeholder-02.jpg', '/images/events/placeholder-04.jpg'],
		status: 'past',
	},
];

export const upcomingEvents = events.filter((event) => event.status === 'upcoming');
export const pastEvents = events.filter((event) => event.status === 'past');
