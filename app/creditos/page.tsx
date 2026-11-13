import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreditsClaimView from '@/components/CreditsClaimView';
import { MarketingColumn, MarketingGrid } from '@/components/layout/MarketingGrid';
import { siteConfig } from '@/content/site.config';

export const metadata: Metadata = {
	title: 'Créditos de Cursor',
	description: `Reclama los créditos de Cursor del Hackatón México en ${siteConfig.city}.`,
	robots: { index: false, follow: false },
};

export default function CreditosPage() {
	return (
		<main className="min-h-screen scroll-smooth bg-cursor-bg text-cursor-text">
			<Navbar />
			<div className="flex min-h-[calc(100svh-52px)] flex-col justify-center py-10 md:py-16">
				<MarketingGrid>
					<MarketingColumn width="reading">
						<CreditsClaimView />
					</MarketingColumn>
				</MarketingGrid>
			</div>
			<Footer />
		</main>
	);
}
