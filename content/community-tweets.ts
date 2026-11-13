/**
 * REPLACE: Curated community Twitter/X posts for the homepage mosaic.
 *
 * Paste status URLs from your local chapter (not profile URLs).
 * Suggested relevance tiers (desc):
 *   100 — Local community about your city / chapter
 *    90 — Cursor staff about your city / chapter
 *    70 — Nearby / regional Cafe Cursor
 *    55 — Cursor staff about other Cafe Cursor events
 *    40 — Other city community posts
 *
 * Homepage layout is a masonry (CSS columns) — cards stack under each other
 * instead of aligning to fixed rows.
 */

import { siteConfig } from '@/content/site.config';

export type CommunityTweetEmbed = {
	id: string;
	url: string;
	note?: string;
	/** Higher = shown earlier */
	relevance: number;
};

/** First paint + each "Load more" increment */
export const COMMUNITY_TWEET_PAGE_SIZE = 6;

/** Absolute mosaic cap */
export const COMMUNITY_TWEET_MOSAIC_MAX = 100;

type CommunityTweetSource = Omit<CommunityTweetEmbed, 'id'>;

const COMMUNITY_TWEET_EMBEDS_SOURCE: CommunityTweetSource[] = [
	{
		url: 'https://x.com/benln/status/2044779723776028999',
		note: 'Ben Lang — Cafe Cursor Lisbon',
		relevance: 70,
	},
	{
		url: 'https://x.com/benln/status/2038609345970114949',
		note: 'Ben Lang — Cafe Cursor Medellín',
		relevance: 70,
	},
	{
		url: 'https://x.com/benln/status/2029210086187405483',
		note: 'Ben Lang — Cafe Cursor Milan',
		relevance: 70,
	},
	{
		url: 'https://x.com/nandini__bagga/status/2029708076220289057',
		note: 'Nandini — Cafe Cursor Tokyo',
		relevance: 65,
	},
	{
		url: 'https://x.com/benln/status/2035727665819189750',
		note: 'Ben Lang — Cafe Cursor Hong Kong',
		relevance: 65,
	},
	{
		url: 'https://x.com/benln/status/2013248319963750796',
		note: 'Ben Lang — Cafe Cursor Madrid',
		relevance: 60,
	},
	{
		url: 'https://x.com/merycodes/status/2015435284804977106',
		note: 'Mery — Cursor Café Berlin',
		relevance: 55,
	},
	{
		url: 'https://x.com/ericzakariasson/status/1967631084864278875',
		note: 'Eric — Cursor Cafe opening',
		relevance: 50,
	},
];

function byRelevance(a: CommunityTweetEmbed, b: CommunityTweetEmbed): number {
	if (b.relevance !== a.relevance) return b.relevance - a.relevance;
	return (a.note ?? a.url).localeCompare(b.note ?? b.url);
}

/** Extract numeric status id from an x.com / twitter.com status URL. */
export function tweetIdFromUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		const host = parsed.hostname.replace(/^www\./, '');
		if (host !== 'x.com' && host !== 'twitter.com') return null;
		const match = parsed.pathname.match(/^\/[^/]+\/status\/(\d+)/);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

function withTweetId(entry: CommunityTweetSource): CommunityTweetEmbed | null {
	const id = tweetIdFromUrl(entry.url);
	if (!id) return null;
	return { ...entry, id };
}

export const COMMUNITY_TWEET_EMBEDS: CommunityTweetEmbed[] = COMMUNITY_TWEET_EMBEDS_SOURCE.map(withTweetId)
	.filter((entry): entry is CommunityTweetEmbed => entry !== null)
	.sort(byRelevance)
	.slice(0, COMMUNITY_TWEET_MOSAIC_MAX);

const ALLOWED_EMBED_IDS = new Set(COMMUNITY_TWEET_EMBEDS.map((entry) => entry.id));

export function isAllowedCommunityTweetId(id: string): boolean {
	return ALLOWED_EMBED_IDS.has(id);
}

export function hasCommunityTweetContent(): boolean {
	return COMMUNITY_TWEET_EMBEDS.length > 0;
}

/** Live X search for local Cursor / Cafe Cursor mentions. Opens on X (not embeddable). */
export function communityTweetsOnXHref(city = siteConfig.city, communityName = siteConfig.communityName): string {
	const query = `("Cursor ${city}") OR (@cursor_ai ${city}) OR ("Cafe Cursor" ${communityName})`;
	return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
}
