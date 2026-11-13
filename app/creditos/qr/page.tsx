import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TextLink } from '@/components/ui';
import { MarketingColumn, MarketingGrid } from '@/components/layout/MarketingGrid';
import { publicClaimUrl } from '@/lib/credits/config';
import { claimQrSvg } from '@/lib/credits/qr';
import { siteConfig } from '@/content/site.config';

export const metadata: Metadata = {
	title: 'QR de créditos',
	robots: { index: false, follow: false },
};

export default async function CreditosQrPage() {
	const url = publicClaimUrl();
	const svg = await claimQrSvg(url);

	return (
		<main className="min-h-screen bg-cursor-bg text-cursor-text">
			<div className="print:hidden">
				<Navbar />
			</div>
			<div className="py-16 md:py-24 print:py-8">
				<MarketingGrid>
					<MarketingColumn width="reading" className="flex flex-col items-center text-center">
						<p className="cursor-eyebrow mb-2">Hackatón México · {siteConfig.city}</p>
						<h1 className="cursor-section-title mb-3 text-cursor-text">Escanea para reclamar tus créditos</h1>
						<p className="mb-8 max-w-md text-base text-cursor-text-secondary">
							Imprime esta página y colócala en la mesa de registro. El código abre la página de créditos.
						</p>
						<div
							className="w-full max-w-[320px] rounded-sm border border-cursor-border bg-white p-6 print:border-0"
							dangerouslySetInnerHTML={{ __html: svg }}
							aria-hidden="true"
						/>
						<p className="mt-6 break-all font-mono text-sm text-cursor-text">{url}</p>
						<p className="print:hidden mt-8 text-sm text-cursor-text-muted">
							<TextLink href="/creditos">Ir a la página de créditos</TextLink>
						</p>
					</MarketingColumn>
				</MarketingGrid>
			</div>
			<div className="print:hidden">
				<Footer />
			</div>
		</main>
	);
}
