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
			<div className="py-16 md:py-24">
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
