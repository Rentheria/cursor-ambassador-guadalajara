import React from 'react';
import dynamic from 'next/dynamic';
import { siteConfig } from '@/content/site.config';

const CommunityTweetsLazy = siteConfig.sections.communityTweets
	? dynamic(() => import('@/components/CommunityTweets'), { loading: () => null })
	: null;

export default function CommunityTweetsSection() {
	if (!CommunityTweetsLazy) return null;
	return <CommunityTweetsLazy />;
}
