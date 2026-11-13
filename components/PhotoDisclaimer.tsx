'use client';

import React from 'react';
import { Camera } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const PhotoDisclaimer: React.FC = () => {
	const { t } = useI18n();

	return (
		<section className="mb-8 rounded-sm border border-cursor-border bg-cursor-surface p-6 md:p-8">
			<div className="flex items-center gap-3 mb-4">
				<Camera className="w-5 h-5 text-cursor-text" />
				<h2 className="text-xl font-normal text-cursor-text">{t('photos.title')}</h2>
			</div>

			<div className="text-cursor-text-muted space-y-3 text-sm">
				<p>{t('photos.description')}</p>
				<div className="rounded-sm border border-cursor-border bg-cursor-bg p-4">
					<p className="text-cursor-text font-medium mb-2">{t('photos.preference')}</p>
					<ul className="space-y-1 text-sm list-disc list-inside">
						<li>{t('photos.option1')}</li>
						<li>{t('photos.option2')}</li>
					</ul>
				</div>
				<p className="text-xs">{t('photos.thanks')}</p>
			</div>
		</section>
	);
};

export default PhotoDisclaimer;
