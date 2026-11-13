import { FeaturedResource } from '@/lib/types';
import { upcomingEvents } from '@/content/events';
import { siteConfig } from '@/content/site.config';

const kickoff = upcomingEvents[0];

export const featuredResource: FeaturedResource = {
	title: kickoff?.title ?? siteConfig.communityName,
	description: kickoff?.location ? `${kickoff.displayDate} · ${kickoff.location}` : siteConfig.description,
	href: kickoff?.lumaUrl ?? siteConfig.lumaUrl,
};
