import { BentoSlot } from '@/lib/types';

// Fixed layout slots for the hero bento grid. Images shuffle daily; geometry stays put.
// Desktop: 4 columns × 4 rows (16 cells), 7 slots.
export const desktopBentoSlots: BentoSlot[] = [
	{
		row: 1,
		col: 1,
		rowSpan: 2,
		colSpan: 2,
		mobile: { row: 1, col: 1, rowSpan: 2, colSpan: 2 },
	},
	{
		row: 1,
		col: 3,
		mobile: { row: 3, col: 1 },
	},
	{
		row: 1,
		col: 4,
		rowSpan: 2,
		mobileHidden: true,
	},
	{
		row: 2,
		col: 3,
		mobile: { row: 3, col: 2 },
	},
	{
		row: 3,
		col: 1,
		rowSpan: 2,
		mobileHidden: true,
	},
	{
		row: 3,
		col: 2,
		rowSpan: 2,
		colSpan: 2,
		mobileHidden: true,
	},
	{
		row: 3,
		col: 4,
		rowSpan: 2,
		mobile: { row: 4, col: 1, colSpan: 2 },
	},
];

export const mobileBentoGrid = { cols: 2, rows: 4 } as const;
export const desktopBentoGrid = { cols: 4, rows: 4 } as const;
