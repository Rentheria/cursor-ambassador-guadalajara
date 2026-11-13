'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import { Button } from '@/components/ui';
import { MarketingColumn, MarketingGrid } from '@/components/layout/MarketingGrid';
import { siteConfig } from '@/content/site.config';

const NAV_LINKS = [
	{ href: '/#community', sectionId: 'community', key: 'nav.community' },
	{ href: '/#events', sectionId: 'events', key: 'nav.events' },
	{ href: '/#recaps', sectionId: 'recaps', key: 'nav.recaps' },
] as const;

function useScrollState() {
	const [scrolled, setScrolled] = useState(false);
	const [activeSection, setActiveSection] = useState<string | null>(null);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);

			const sections = ['community', 'events', 'recaps'];
			let current: string | null = null;
			for (const id of sections) {
				const el = document.getElementById(id);
				if (el) {
					const rect = el.getBoundingClientRect();
					if (rect.top <= 120 && rect.bottom > 120) {
						current = id;
					}
				}
			}
			setActiveSection(current);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return { scrolled, activeSection };
}

export default function Navbar() {
	const { t } = useI18n();
	const { scrolled, activeSection } = useScrollState();
	const [mobileOpen, setMobileOpen] = useState(false);

	const closeMobile = useCallback(() => setMobileOpen(false), []);

	useEffect(() => {
		const onResize = () => {
			if (window.innerWidth >= 640) setMobileOpen(false);
		};
		window.addEventListener('resize', onResize, { passive: true });
		return () => window.removeEventListener('resize', onResize);
	}, []);

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [mobileOpen]);

	return (
		<>
			<nav
				className={`sticky top-0 z-40 transition-colors duration-150 ${
					scrolled
						? 'border-b border-cursor-border bg-cursor-bg/95 backdrop-blur-md'
						: 'border-b border-transparent bg-cursor-bg'
				}`}
			>
				<MarketingGrid className="h-[52px] items-center">
					<MarketingColumn width="full" className="flex items-center justify-between gap-5">
						<Link href="/" className="flex items-center gap-2.5">
							<Image
								src="/cursor-logo.svg"
								alt="Cursor"
								width={120}
								height={32}
								priority
								className="cursor-wordmark h-6 w-auto"
							/>
							<span className="hidden text-sm font-normal text-cursor-text-secondary md:inline">
								{siteConfig.communityNameLocal}
							</span>
						</Link>

						<div className="hidden items-center gap-6 sm:flex">
							{NAV_LINKS.map(({ href, sectionId, key }) => {
								const isActive = activeSection === sectionId;
								return (
									<Link
										key={href}
										href={href}
										className={`text-sm transition-colors duration-150 ${
											isActive ? 'text-cursor-text' : 'text-cursor-text-muted hover:text-cursor-text'
										}`}
									>
										{t(key)}
									</Link>
								);
							})}
							<LanguageToggle />
							<Button href={siteConfig.lumaUrl} external variant="primary" size="sm">
								{t('nav.joinUs')}
							</Button>
						</div>

						<div className="flex items-center gap-2 sm:hidden">
							<Button href={siteConfig.lumaUrl} external variant="primary" size="sm">
								{t('nav.joinUs')}
							</Button>
							<button
								onClick={() => setMobileOpen(!mobileOpen)}
								className="flex h-8 w-8 items-center justify-center rounded-full text-cursor-text-muted transition-colors duration-150 hover:bg-cursor-surface hover:text-cursor-text"
								aria-label="Toggle menu"
								aria-expanded={mobileOpen}
							>
								{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
							</button>
						</div>
					</MarketingColumn>
				</MarketingGrid>
			</nav>

			{mobileOpen && (
				<div className="fixed inset-0 top-[52px] z-30 border-t border-cursor-border bg-cursor-bg sm:hidden">
					<div className="flex flex-col items-center gap-6 pt-12">
						{NAV_LINKS.map(({ href, key }) => (
							<Link
								key={href}
								href={href}
								onClick={closeMobile}
								className="text-lg text-cursor-text-muted hover:text-cursor-text transition-colors"
							>
								{t(key)}
							</Link>
						))}
						<LanguageToggle />
					</div>
				</div>
			)}
		</>
	);
}
