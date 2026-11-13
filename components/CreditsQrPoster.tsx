'use client';

import CreditsQrPrintButton from '@/components/CreditsQrPrintButton';
import { useI18n } from '@/lib/i18n';
import { siteConfig } from '@/content/site.config';
import { upcomingEvents } from '@/content/events';

type CreditsQrPosterProps = {
	url: string;
	svg: string;
};

export default function CreditsQrPoster({ url, svg }: CreditsQrPosterProps) {
	const { t } = useI18n();
	const kickoff = upcomingEvents[0];

	return (
		<article className="mx-auto flex min-h-[calc(100svh-52px)] w-full max-w-[40rem] flex-col items-center justify-center px-5 py-12 text-center print:min-h-[100vh] print:max-w-none print:justify-start print:py-10">
			<p className="cursor-eyebrow">{siteConfig.communityName}</p>
			<h1 className="cursor-display mt-3 max-w-[14ch] text-cursor-text">{kickoff?.title ?? t('credits.heading')}</h1>
			<p className="mt-4 text-base text-cursor-text-secondary md:text-lg">
				{kickoff?.displayDate}
				{kickoff?.location ? <span className="text-cursor-text-faint"> · {kickoff.location}</span> : null}
			</p>

			<div
				className="mt-10 w-full max-w-[22rem] overflow-hidden rounded-sm border border-cursor-border bg-white p-5 print:mt-12 print:max-w-[18rem] print:p-4 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
				dangerouslySetInnerHTML={{ __html: svg }}
				aria-hidden="true"
			/>

			<p className="mt-6 max-w-sm text-base font-medium leading-relaxed text-cursor-text">
				{t('credits.qrInstruction')}
			</p>
			<p className="mt-3 max-w-full break-all font-mono text-xs text-cursor-text-muted sm:text-sm">{url}</p>

			<div className="mt-8 print:hidden">
				<CreditsQrPrintButton />
			</div>
		</article>
	);
}
