import {
	COMMUNITY_TWEET_EMBEDS,
	communityTweetsOnXHref,
	isAllowedCommunityTweetId,
	tweetIdFromUrl,
} from '../content/community-tweets';

function main() {
	if (COMMUNITY_TWEET_EMBEDS.length === 0) {
		throw new Error('validate-community-tweets: embed list is empty');
	}

	const ids = new Set<string>();

	for (const entry of COMMUNITY_TWEET_EMBEDS) {
		const parsedId = tweetIdFromUrl(entry.url);
		if (!parsedId) {
			throw new Error(`validate-community-tweets: invalid status URL ${entry.url}`);
		}
		if (parsedId !== entry.id) {
			throw new Error(
				`validate-community-tweets: id mismatch for ${entry.url} (expected ${parsedId}, got ${entry.id})`,
			);
		}
		if (!isAllowedCommunityTweetId(entry.id)) {
			throw new Error(`validate-community-tweets: id not allowlisted ${entry.id}`);
		}
		if (ids.has(entry.id)) {
			throw new Error(`validate-community-tweets: duplicate id ${entry.id}`);
		}
		ids.add(entry.id);
	}

	const browseHref = communityTweetsOnXHref();
	let browseUrl: URL;
	try {
		browseUrl = new URL(browseHref);
	} catch {
		throw new Error(`validate-community-tweets: invalid Browse on X href ${browseHref}`);
	}
	if (browseUrl.hostname !== 'x.com' || !browseUrl.pathname.includes('search')) {
		throw new Error(`validate-community-tweets: Browse on X href must be an x.com search URL`);
	}

	console.log(`validate-community-tweets: OK (${COMMUNITY_TWEET_EMBEDS.length} embeds, allowlist + Browse on X)`);
}

main();
