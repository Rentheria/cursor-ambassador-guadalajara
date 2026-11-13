'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

export default function CreditsQrPrintButton() {
	const { t } = useI18n();

	return (
		<Button type="button" variant="primary" size="md" className="print:hidden" onClick={() => window.print()}>
			<Printer className="size-4" strokeWidth={1.75} aria-hidden="true" />
			{t('credits.qrPrint')}
		</Button>
	);
}
