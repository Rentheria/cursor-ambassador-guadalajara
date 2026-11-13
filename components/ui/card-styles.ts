/**
 * Flat Cursor-style cards: hairline border, no colored glow.
 * Prefer these over ad-hoc hover:shadow-[0_0_30px_…] washes.
 */

export const cardBase =
	'relative overflow-hidden bg-cursor-surface border border-cursor-border rounded-sm transition-colors duration-150';

export const cardHover = 'hover:border-cursor-border-emphasis';

export const cardInteractive = `${cardBase} ${cardHover}`;

/** Featured / accent-rail event card */
export const cardFeatured =
	'relative overflow-hidden bg-cursor-surface border border-cursor-border border-l-2 border-l-cursor-accent-orange rounded-sm';

/** Ambassador / partner tile on darker ground */
export const cardTile =
	'bg-cursor-surface border border-cursor-border rounded-sm transition-colors duration-150 hover:bg-cursor-surface-raised hover:border-cursor-border-emphasis';
