/**
 * Cursor-marketing button tokens.
 * Copy this file + Button.tsx into Thailand as a unit.
 *
 * Hierarchy (matches cursor.com /pricing + /download):
 * - primary  → dark filled pill (espresso / inverted text)
 * - accent   → orange pill (rationed: Register, Join, live actions)
 * - secondary → hairline outline pill
 * - ghost    → text-only
 */

export const buttonBase =
	'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor-accent-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cursor-bg disabled:opacity-50 disabled:pointer-events-none';

export const buttonSizes = {
	sm: 'px-3.5 py-1.5 text-sm',
	md: 'px-5 py-2.5 text-sm',
	lg: 'px-6 py-3 text-base',
} as const;

export const buttonVariants = {
	primary: 'bg-cursor-action text-cursor-action-text hover:bg-cursor-action-hover',
	accent: 'bg-cursor-accent-orange text-white hover:bg-cursor-accent-orange-hover',
	secondary:
		'border border-cursor-border bg-cursor-surface text-cursor-text-secondary hover:bg-cursor-surface-raised hover:border-cursor-border-emphasis hover:text-cursor-text',
	ghost: 'text-cursor-text-muted hover:text-cursor-text',
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
