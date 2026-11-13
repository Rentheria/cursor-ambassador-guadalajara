// Guadalajara chapter. Keep the required footer template credit in components/Footer.tsx.
export const siteConfig = {
	communityName: 'Cursor Guadalajara',
	communityNameLocal: 'Guadalajara',
	city: 'Guadalajara',
	country: 'México',
	lumaUrl: 'https://luma.com/k07swqi7',
	lumaCalendarEmbedUrl: '',
	cursorCommunityUrl: 'https://cursor.com/community',
	defaultLocale: 'es',
	locales: ['es', 'en'],
	footerTagline: 'Hecho con Cursor por la comunidad de Guadalajara',
	description:
		'Kickoff del Hackatón México en Guadalajara: créditos de Cursor, comunidad local y el siguiente Cafe Cursor.',
	ogImage: '/og.jpg',
	sections: {
		matchmaking: false,
		photoDisclaimer: false,
		lumaCalendar: false,
		communityTweets: false,
		communityQuotes: false,
	},
};

export type SiteConfig = typeof siteConfig;
