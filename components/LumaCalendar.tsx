'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { siteConfig } from '@/content/site.config';

type LumaCalendarSectionProps = {
	className?: string;
	height?: number;
};

const LumaCalendarSection: React.FC<LumaCalendarSectionProps> = ({ className, height = 450 }) => {
	const { t } = useI18n();

	if (!siteConfig.sections.lumaCalendar || !siteConfig.lumaCalendarEmbedUrl) {
		return null;
	}

	return (
		<section className={`mb-20 scroll-mt-20 ${className ?? ''}`}>
			<p className="cursor-eyebrow mb-2">{t('home.lumaCalendar')}</p>
			<h2 className="cursor-section-title mb-8 text-cursor-text">{t('home.lumaCalendarHeading')}</h2>
			<div className="rounded-md border border-cursor-border overflow-hidden bg-cursor-surface">
				<iframe
					src={siteConfig.lumaCalendarEmbedUrl}
					width="100%"
					height={height}
					loading="lazy"
					allowFullScreen
					tabIndex={0}
					title={`${siteConfig.communityName} — upcoming events calendar`}
					className="block w-full"
				/>
			</div>
		</section>
	);
};

export default LumaCalendarSection;
