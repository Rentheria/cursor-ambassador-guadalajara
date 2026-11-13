/**
 * Compact status / plan pills (cursor.com “Latest”, plan tabs).
 * Copy with Badge.tsx into Thailand.
 */

export const badgeBase =
	'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide';

export const badgeVariants = {
	neutral: 'border-cursor-border bg-cursor-overlay text-cursor-text-muted',
	live: 'border-cursor-accent-blue/30 bg-cursor-accent-blue-bg text-cursor-accent-blue',
	accent: 'border-cursor-accent-orange/30 bg-cursor-accent-orange-bg text-cursor-accent-orange',
	success: 'border-cursor-accent-green/30 bg-cursor-accent-green-bg text-cursor-accent-green',
} as const;

export type BadgeVariant = keyof typeof badgeVariants;
