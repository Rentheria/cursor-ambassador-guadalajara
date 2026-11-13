import { redirect } from 'next/navigation';
import SlideContent from '@/modules/slides/components/SlideContent';
import SlideLayout from '@/modules/slides/components/SlideLayout';
import { defaultSlideDeck } from '@/modules/slides/content/index';

interface SlidePageProps {
	params: Promise<{ id: string }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
	// Slide 1 lives at /slides — only prebuild 2…N
	return Array.from({ length: Math.max(0, defaultSlideDeck.totalSlides - 1) }, (_, index) => ({
		id: String(index + 2),
	}));
}

export default async function SlidePage({ params }: SlidePageProps) {
	const { id: idParam } = await params;
	const id = Number(idParam);

	if (!Number.isInteger(id) || id < 1 || id > defaultSlideDeck.totalSlides || id === 1) {
		redirect('/slides');
	}

	const slide = defaultSlideDeck.deck[id - 1];
	if (!slide) {
		redirect('/slides');
	}

	return (
		<SlideLayout currentSlide={id} totalSlides={defaultSlideDeck.totalSlides}>
			<SlideContent slide={slide} />
		</SlideLayout>
	);
}

export async function generateMetadata({ params }: SlidePageProps) {
	const { id: idParam } = await params;
	const id = Number(idParam);
	const slide = defaultSlideDeck.deck[id - 1];

	return {
		title: slide?.title ? `${slide.title} · Workshop Slides` : 'Workshop Slides',
	};
}
