'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const MatchmakingSection: React.FC = () => {
	const { t } = useI18n();

	return (
		<section className="mb-8 rounded-sm border border-cursor-border bg-cursor-surface p-6 md:p-8">
			<div className="flex items-center gap-3 mb-6">
				<Users className="w-5 h-5 text-cursor-text" />
				<h2 className="text-xl font-normal text-cursor-text">{t('matchmaking.title')}</h2>
			</div>

			<div className="space-y-6 text-cursor-text-muted">
				<div className="rounded-sm border border-cursor-border bg-cursor-bg p-6">
					<h3 className="text-base font-medium mb-3 text-cursor-text">{t('matchmaking.howItWorks')}</h3>
					<ol className="space-y-2 list-decimal list-inside text-sm">
						<li>{t('matchmaking.step1', { numberCard: t('matchmaking.numberCard') })}</li>
						<li>{t('matchmaking.step2', { sameNumber: t('matchmaking.sameNumber') })}</li>
						<li>{t('matchmaking.step3')}</li>
					</ol>
				</div>

				<div className="rounded-sm border border-cursor-border bg-cursor-bg p-6">
					<h3 className="text-base font-medium mb-3 text-cursor-text">{t('matchmaking.iceBreakers')}</h3>
					<ul className="space-y-2 text-sm">
						<li className="flex items-start gap-2">
							<span className="text-cursor-text">•</span>
							<span>{t('matchmaking.question1')}</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-cursor-text">•</span>
							<span>{t('matchmaking.question2')}</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-cursor-text">•</span>
							<span>{t('matchmaking.question3')}</span>
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
};

export default MatchmakingSection;
