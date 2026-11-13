'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function RecapBackLink() {
	const { t } = useI18n();

	return (
		<Link
			href="/#recaps"
			className="inline-flex items-center gap-2 text-sm text-cursor-text-muted hover:text-cursor-text transition-colors mb-8"
		>
			<ArrowLeft className="w-4 h-4" />
			{t('recap.backToEvents')}
		</Link>
	);
}
