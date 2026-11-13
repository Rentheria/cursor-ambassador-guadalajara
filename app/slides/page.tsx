import SlideContent from '@/modules/slides/components/SlideContent';
import SlideLayout from '@/modules/slides/components/SlideLayout';
import { defaultSlideDeck } from '@/modules/slides/content/index';

/** Canonical shareable entry — renders slide 1. */
export default function SlidesEntryPage() {
	const slide = defaultSlideDeck.deck[0];

	return (
		<SlideLayout currentSlide={1} totalSlides={defaultSlideDeck.totalSlides}>
			<SlideContent slide={slide} />
		</SlideLayout>
	);
}

export const metadata = {
	title: 'Workshop Slides',
	description: 'Community workshop slides',
};
