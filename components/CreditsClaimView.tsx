'use client';

import CreditsClaimForm from '@/components/CreditsClaimForm';
import { useI18n } from '@/lib/i18n';
import { siteConfig } from '@/content/site.config';

export default function CreditsClaimView() {
	const { t } = useI18n();

	return (
		<>
			<p className="cursor-eyebrow mb-2">{t('credits.eyebrow', { city: siteConfig.city })}</p>
			<h1 className="cursor-display max-w-[16ch] text-cursor-text">{t('credits.heading')}</h1>
			<p className="mt-5 max-w-xl text-base leading-relaxed text-cursor-text-secondary md:text-lg">
				{t('credits.description')}
			</p>
			<div className="mt-10">
				<CreditsClaimForm />
			</div>
		</>
	);
}
