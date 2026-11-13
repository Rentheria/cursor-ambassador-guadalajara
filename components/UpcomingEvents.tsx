'use client';

import React from 'react';
import { upcomingEvents } from '@/content/events';
import { useI18n } from '@/lib/i18n';
import { Badge, TextLink } from '@/components/ui';
import { groupEventsByDate } from '@/lib/group-events-by-date';

const UpcomingEvents: React.FC = () => {
	const { locale, t } = useI18n();

	if (upcomingEvents.length === 0) {
		return null;
	}

	const groups = groupEventsByDate(upcomingEvents, locale);

	return (
		<section id="events" className="mb-20 scroll-mt-20">
			<p className="cursor-eyebrow mb-2">{t('home.upcomingEvents')}</p>
			<h2 className="cursor-section-title mb-10 text-cursor-text">{t('home.upcomingHeading')}</h2>

			<div className="border-t border-cursor-border">
				{groups.map((group) => (
					<div
						key={group.key}
						className="grid gap-5 border-b border-cursor-border py-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-10"
					>
						<h3 className="text-base font-normal text-cursor-text">{group.label}</h3>
						<div className="divide-y divide-cursor-border">
							{group.events.map((event) => (
								<article
									key={event.id}
									className="grid gap-4 py-1 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
								>
									<div className="min-w-0">
										<h4 className="text-lg font-normal tracking-tight text-cursor-text">{event.title}</h4>
										<p className="mt-1 text-sm text-cursor-text-muted">
											{event.host ? `${event.host.name} · ` : ''}
											{event.location}
										</p>
									</div>
									<div className="sm:pt-0.5">
										{event.lumaUrl ? (
											<TextLink href={event.lumaUrl} external>
												RSVP
											</TextLink>
										) : (
											<Badge variant="neutral">{t('home.comingSoon')}</Badge>
										)}
									</div>
								</article>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default UpcomingEvents;
