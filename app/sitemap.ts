import { MetadataRoute } from 'next';
import { recapsBySlug } from '@/content/recaps';
import { defaultSlideDeck } from '@/modules/slides/content/index';

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL ||
	(process.env.VERCEL_PROJECT_PRODUCTION_URL
		? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
		: 'https://example.com');

export default function sitemap(): MetadataRoute.Sitemap {
	const recapEntries = Object.values(recapsBySlug).map((recap) => ({
		url: `${BASE_URL}/recaps/${recap.slug}`,
		lastModified: new Date(),
		changeFrequency: 'monthly' as const,
		priority: 0.7,
	}));

	const slideEntries = [
		{
			url: `${BASE_URL}/slides`,
			lastModified: new Date(),
			changeFrequency: 'monthly' as const,
			priority: 0.6,
		},
		...Array.from({ length: Math.max(0, defaultSlideDeck.totalSlides - 1) }, (_, index) => ({
			url: `${BASE_URL}/slides/${index + 2}`,
			lastModified: new Date(),
			changeFrequency: 'monthly' as const,
			priority: 0.5,
		})),
	];

	return [
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 1,
		},
		...recapEntries,
		...slideEntries,
	];
}
