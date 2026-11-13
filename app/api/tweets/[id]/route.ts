import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getTweet as fetchTweet } from 'react-tweet/api';
import { isAllowedCommunityTweetId } from '@/content/community-tweets';

export const runtime = 'nodejs';

const TWEET_FETCH_TIMEOUT_MS = 8_000;

async function fetchTweetWithTimeout(id: string) {
	return await Promise.race([
		fetchTweet(id),
		new Promise<never>((_, reject) => {
			setTimeout(
				() => reject(new Error(`Tweet fetch timed out after ${TWEET_FETCH_TIMEOUT_MS}ms`)),
				TWEET_FETCH_TIMEOUT_MS,
			);
		}),
	]);
}

const getCachedTweet = unstable_cache(async (id: string) => fetchTweetWithTimeout(id), ['community-tweet'], {
	revalidate: 86_400,
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!isAllowedCommunityTweetId(id)) {
		return NextResponse.json({ error: 'Tweet not allowlisted' }, { status: 400 });
	}

	try {
		const tweet = await getCachedTweet(id);
		return NextResponse.json(
			{ data: tweet ?? null },
			{
				status: tweet ? 200 : 404,
				headers: {
					'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
				},
			},
		);
	} catch (error) {
		console.error('[api/tweets]', id, error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch tweet' },
			{ status: 502 },
		);
	}
}
