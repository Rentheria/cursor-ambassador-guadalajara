'use client';

import CreditsAdminPanel from '@/components/CreditsAdminPanel';
import { TextLink } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

export default function CreditsAdminView() {
	const { t } = useI18n();

	return (
		<>
			<p className="cursor-eyebrow mb-2">{t('credits.adminEyebrow')}</p>
			<h1 className="cursor-section-title mb-3 text-cursor-text">{t('credits.adminHeading')}</h1>
			<p className="mb-10 max-w-2xl text-base text-cursor-text-secondary">{t('credits.adminDescription')}</p>
			<CreditsAdminPanel />
			<p className="mt-8 text-sm text-cursor-text-muted">
				<TextLink href="/creditos">{t('credits.backToClaim')}</TextLink>
			</p>
		</>
	);
}
