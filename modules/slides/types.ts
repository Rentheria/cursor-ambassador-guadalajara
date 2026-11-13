import type { ReactNode } from 'react';

export type SlideType = 'title' | 'content' | 'code' | 'prompt' | 'diagram' | 'workshop';

export interface Slide {
	id: number;
	title: string;
	content: ReactNode | string;
	/** Title slides get full-viewport editorial chrome in SlideLayout */
	type?: SlideType;
	notes?: string;
}
