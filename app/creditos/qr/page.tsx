import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreditsQrPoster from '@/components/CreditsQrPoster';
import { ADMIN_COOKIE, CREDITS_ADMIN_PATH, publicClaimUrl } from '@/lib/credits/config';
import { passwordConfigured, verifyAdminToken } from '@/lib/credits/auth';
import { claimQrSvg } from '@/lib/credits/qr';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'QR de créditos',
	robots: { index: false, follow: false },
};

export default async function CreditosQrPage() {
	if (passwordConfigured()) {
		const token = (await cookies()).get(ADMIN_COOKIE)?.value;
		if (!verifyAdminToken(token)) {
			redirect(CREDITS_ADMIN_PATH);
		}
	}

	const url = publicClaimUrl();
	const svg = await claimQrSvg(url);

	return (
		<main className="min-h-screen bg-cursor-bg text-cursor-text print:bg-white print:text-black">
			<div className="print:hidden">
				<Navbar />
			</div>
			<CreditsQrPoster url={url} svg={svg} />
			<div className="print:hidden">
				<Footer />
			</div>
		</main>
	);
}
