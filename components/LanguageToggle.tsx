'use client';

import React from 'react';
import { siteConfig } from '@/content/site.config';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/components/ui';

const LanguageToggle: React.FC = () => {
	const { locale, setLocale } = useI18n();

	if (siteConfig.locales.length <= 1) {
		return null;
	}

	return (
		<div className="flex items-center gap-1 rounded-full border border-cursor-border bg-cursor-surface p-0.5">
			{siteConfig.locales.map((localeCode) => (
				<button
					key={localeCode}
					type="button"
					onClick={() => setLocale(localeCode)}
					className={cn(
						'rounded-full px-3 py-1 text-sm font-medium transition-colors',
						locale === localeCode
							? 'bg-cursor-action text-cursor-action-text'
							: 'text-cursor-text-muted hover:text-cursor-text',
					)}
				>
					{localeCode.toUpperCase()}
				</button>
			))}
		</div>
	);
};

export default LanguageToggle;
