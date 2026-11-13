'use client';

import { useEffect, useState } from 'react';
import CreditsClaimForm from '@/components/CreditsClaimForm';
import { cardBase } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { siteConfig } from '@/content/site.config';
import { upcomingEvents } from '@/content/events';
import {
	evaluateClaimWindow,
	formatClaimMoment,
	parseClaimInstant,
	type ClaimWindowSnapshot,
	type ClaimWindowStatus,
} from '@/lib/credits/window';

function liveWindowStatus(snapshot: ClaimWindowSnapshot, now = new Date()): ClaimWindowStatus {
	return evaluateClaimWindow(now, parseClaimInstant(snapshot.openAt), parseClaimInstant(snapshot.closeAt));
}

export default function CreditsClaimView({ claimWindow }: { claimWindow: ClaimWindowSnapshot }) {
	const { t, locale } = useI18n();
	const kickoff = upcomingEvents[0];
	const [showingResult, setShowingResult] = useState(false);
	const [windowStatus, setWindowStatus] = useState<ClaimWindowStatus>(() => liveWindowStatus(claimWindow));

	useEffect(() => {
		const tick = () => setWindowStatus(liveWindowStatus(claimWindow));
		tick();
		const id = window.setInterval(tick, 1000);
		return () => window.clearInterval(id);
	}, [claimWindow]);

	const momentLocale = locale.toLowerCase().startsWith('en') ? 'en-US' : 'es-MX';
	const openWhen = claimWindow.openAt ? formatClaimMoment(new Date(claimWindow.openAt), momentLocale) : '';
	const closeWhen = claimWindow.closeAt ? formatClaimMoment(new Date(claimWindow.closeAt), momentLocale) : '';

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
				{showingResult || windowStatus !== 'open' ? null : (
					<p className="mt-5 max-w-xl text-base leading-relaxed text-cursor-text-secondary md:text-lg">
						{t('credits.description')}
					</p>
				)}
			</header>
			{windowStatus === 'not_open' ? (
				<section className={`${cardBase} max-w-xl p-5 sm:p-7`} data-testid="credits-not-open">
					<h2 className="text-2xl text-cursor-text">{t('credits.notOpenHeading')}</h2>
					<p className="mt-3 text-sm leading-relaxed text-cursor-text-secondary md:text-base">
						{t('credits.notOpenBody', { when: openWhen })}
					</p>
				</section>
			) : windowStatus === 'closed' ? (
				<section className={`${cardBase} max-w-xl p-5 sm:p-7`} data-testid="credits-closed">
					<h2 className="text-2xl text-cursor-text">{t('credits.closedHeading')}</h2>
					<p className="mt-3 text-sm leading-relaxed text-cursor-text-secondary md:text-base">
						{closeWhen ? t('credits.closedBody', { when: closeWhen }) : t('credits.closedBodyFallback')}
					</p>
				</section>
			) : (
				<CreditsClaimForm onOutcome={(status) => setShowingResult(status !== null)} />
			)}
		</div>
	);
}
