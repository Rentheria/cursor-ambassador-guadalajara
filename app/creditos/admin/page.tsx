import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreditsAdminView from '@/components/CreditsAdminView';
import { MarketingColumn, MarketingGrid } from '@/components/layout/MarketingGrid';

export const metadata: Metadata = {
	title: 'Organización · créditos',
	robots: { index: false, follow: false },
};

export default function CreditosAdminPage() {
	return (
		<main className="min-h-screen scroll-smooth bg-cursor-bg text-cursor-text">
			<Navbar />
			<div className="py-16 md:py-24">
				<MarketingGrid>
					<MarketingColumn width="wide">
						<CreditsAdminView />
					</MarketingColumn>
				</MarketingGrid>
			</div>
			<Footer />
		</main>
	);
}
