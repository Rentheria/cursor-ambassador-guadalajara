import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventRecap from '@/components/EventRecap';
import JsonLd from '@/components/JsonLd';
import Navbar from '@/components/Navbar';
import RecapBackLink from '@/components/RecapBackLink';
import { recapsBySlug } from '@/content/recaps';
import { siteConfig } from '@/content/site.config';
import Footer from '@/components/Footer';
import { MarketingColumn, MarketingGrid } from '@/components/layout/MarketingGrid';

interface RecapPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return Object.keys(recapsBySlug).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: RecapPageProps): Promise<Metadata> {
	const { slug } = await params;
	const recap = recapsBySlug[slug];
	if (!recap) return {};

	const description = recap.summary[0] || `${recap.title} — ${recap.date}.`;
	const ogImage = recap.photos[0]?.src || siteConfig.ogImage || '/og.jpg';

	return {
		title: recap.title,
		description,
		openGraph: {
			title: recap.title,
			description,
			type: 'article',
			images: [{ url: ogImage, alt: recap.photos[0]?.alt || recap.title }],
		},
		twitter: {
			card: 'summary_large_image',
			title: recap.title,
			description,
			images: [ogImage],
		},
	};
}

function buildRecapJsonLd(slug: string) {
	const recap = recapsBySlug[slug];
	if (!recap) return null;

	return {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: recap.title,
		startDate: recap.date,
		description: recap.summary[0] || '',
		organizer: {
			'@type': 'Organization',
			name: siteConfig.communityName,
		},
		...(recap.attendees ? { maximumAttendeeCapacity: recap.attendees } : {}),
		...(recap.host
			? {
					location: {
						'@type': 'Place',
						name: recap.host.name,
					},
				}
			: {}),
		...(recap.photos[0]?.src ? { image: recap.photos[0].src } : {}),
		eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
		eventStatus: 'https://schema.org/EventScheduled',
	};
}

export default async function RecapPage({ params }: RecapPageProps) {
	const { slug } = await params;
	const recap = recapsBySlug[slug];
	if (!recap) {
		notFound();
	}

	const jsonLd = buildRecapJsonLd(slug);

	return (
		<main className="min-h-screen bg-cursor-bg text-cursor-text">
			{jsonLd && <JsonLd data={jsonLd} />}
			<Navbar />
			<MarketingGrid className="py-12 md:py-20">
				<MarketingColumn width="reading">
					<RecapBackLink />
					<EventRecap recap={recap} />
				</MarketingColumn>
			</MarketingGrid>
			<Footer />
		</main>
	);
}
