'use client';

import { useState } from 'react';
import CreditsClaimForm from '@/components/CreditsClaimForm';
import { useI18n } from '@/lib/i18n';
import { siteConfig } from '@/content/site.config';
import { upcomingEvents } from '@/content/events';

export default function CreditsClaimView() {
	const { t } = useI18n();
	const kickoff = upcomingEvents[0];
	const [showingResult, setShowingResult] = useState(false);

	return (
		<div className="flex flex-col gap-8 md:gap-10">
			<header>
				<p className="cursor-eyebrow mb-3">{t('credits.eventKicker', { city: siteConfig.city })}</p>
				<h1 className="cursor-display max-w-[16ch] text-cursor-text" data-testid="credits-hero">
					{kickoff?.title ?? t('credits.heading')}
				</h1>
				<p className="mt-4 text-base text-cursor-text-secondary md:text-lg">
					{kickoff?.displayDate}
					{kickoff?.location ? <span className="text-cursor-text-faint"> · {kickoff.location}</span> : null}
				</p>
				{showingResult ? null : (
					<p className="mt-5 max-w-xl text-base leading-relaxed text-cursor-text-secondary md:text-lg">
						{t('credits.description')}
					</p>
				)}
			</header>
			<CreditsClaimForm onOutcome={(status) => setShowingResult(status !== null)} />
		</div>
	);
}
