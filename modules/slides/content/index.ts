import { exampleDeck, totalExampleSlides } from '@/modules/slides/content/example-deck';
import { Slide } from '@/modules/slides/types';

export interface SlideDeckDefinition {
	id: string;
	title: string;
	deck: Slide[];
	totalSlides: number;
}

export const slideDecks: Record<string, SlideDeckDefinition> = {
	'example-deck': {
		id: 'example-deck',
		title: 'Example workshop deck',
		deck: exampleDeck,
		totalSlides: totalExampleSlides,
	},
};

/** Default deck at `/slides` (slide 1) and `/slides/[id]` — swap when adding more decks. */
export const defaultSlideDeck = slideDecks['example-deck'];

export function getSlideDeckRoutes(): { id: string; slideNumber: number }[] {
	return Object.values(slideDecks).flatMap((deck) =>
		Array.from({ length: deck.totalSlides }, (_, index) => ({
			id: deck.id,
			slideNumber: index + 1,
		})),
	);
}
