'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

interface SlideLayoutProps {
	currentSlide: number;
	totalSlides: number;
	children: React.ReactNode;
	/** Shareable deck entry (slide 1). Default `/slides`. */
	entryPath?: string;
	/** Numbered slides path builder. Default `(n) => /slides/${n}`. */
	slidePath?: (slideId: number) => string;
	storageKey?: string;
	/** Treat first + last as title slides (full-bleed chrome). Default true. */
	titleEnds?: boolean;
}

export default function SlideLayout({
	currentSlide,
	totalSlides,
	children,
	entryPath = '/slides',
	slidePath = (n) => `/slides/${n}`,
	storageKey = 'cursor-ambassador-current-slide',
	titleEnds = true,
}: SlideLayoutProps) {
	const router = useRouter();
	const [isNavigating, setIsNavigating] = useState(false);
	const isTitleSlide = titleEnds && (currentSlide === 1 || currentSlide === totalSlides);

	const hrefFor = useCallback(
		(slideId: number) => (slideId <= 1 ? entryPath : slidePath(slideId)),
		[entryPath, slidePath],
	);

	const goToSlide = useCallback(
		(slideId: number) => {
			if (slideId < 1 || slideId > totalSlides) return;
			setIsNavigating(true);
			router.push(hrefFor(slideId));
		},
		[router, hrefFor, totalSlides],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (isNavigating) return;

			switch (e.key) {
				case 'ArrowLeft':
					e.preventDefault();
					if (currentSlide > 1) goToSlide(currentSlide - 1);
					break;
				case 'ArrowRight':
					e.preventDefault();
					if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
					break;
				case 'Home':
					e.preventDefault();
					goToSlide(1);
					break;
				case 'End':
					e.preventDefault();
					goToSlide(totalSlides);
					break;
				default:
					break;
			}
		},
		[currentSlide, isNavigating, goToSlide, totalSlides],
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleKeyDown]);

	useEffect(() => {
		setIsNavigating(false);
		localStorage.setItem(storageKey, String(currentSlide));
	}, [currentSlide, storageKey]);

	return (
		<div className="min-h-screen bg-cursor-bg text-cursor-text flex flex-col font-sans">
			<main
				className={`flex-1 flex overflow-y-auto pb-24 ${
					isTitleSlide
						? 'items-stretch px-10 md:px-20 lg:px-28 xl:px-36'
						: 'items-start justify-center px-6 md:px-10 pt-10 md:pt-14'
				}`}
			>
				<div className={`w-full ${isTitleSlide ? 'max-w-6xl mx-auto flex flex-col' : 'max-w-4xl'}`}>{children}</div>
			</main>

			<div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-cursor-bg/90 backdrop-blur-sm border-t border-cursor-border">
				<div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => goToSlide(currentSlide - 1)}
						disabled={currentSlide === 1}
						aria-label="Previous slide"
					>
						<ChevronLeft className="w-4 h-4" />
						<span className="hidden sm:inline">Previous</span>
					</Button>

					<p className="text-xs text-cursor-text-muted tabular-nums tracking-wide">
						{currentSlide}
						<span className="text-cursor-text-faint"> / {totalSlides}</span>
					</p>

					<Button
						type="button"
						variant="primary"
						size="sm"
						onClick={() => goToSlide(currentSlide + 1)}
						disabled={currentSlide >= totalSlides}
						aria-label="Next slide"
					>
						<span className="hidden sm:inline">Next</span>
						<ChevronRight className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
