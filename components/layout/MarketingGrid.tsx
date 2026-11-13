import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/components/ui';

type MarketingGridProps = HTMLAttributes<HTMLDivElement> & {
	children: ReactNode;
};

/**
 * Cursor-style marketing shell: 1300px of usable space at a 1440px viewport,
 * divided into 24 equal columns on large screens.
 */
export function MarketingGrid({ children, className, ...rest }: MarketingGridProps) {
	return (
		<div
			className={cn(
				'mx-auto grid w-full max-w-[1440px] grid-cols-1 px-[19px] md:px-10 xl:grid-cols-24 xl:px-[70px]',
				className,
			)}
			{...rest}
		>
			{children}
		</div>
	);
}

type MarketingColumnProps = HTMLAttributes<HTMLDivElement> & {
	children: ReactNode;
	width?: 'full' | 'wide' | 'reading' | 'prose';
};

const widthClasses = {
	full: 'xl:col-span-24',
	wide: 'xl:col-start-4 xl:col-span-18',
	reading: 'xl:col-start-6 xl:col-span-14',
	prose: 'xl:col-start-7 xl:col-span-12',
} as const;

export function MarketingColumn({ children, width = 'wide', className, ...rest }: MarketingColumnProps) {
	return (
		<div className={cn('col-span-1 min-w-0', widthClasses[width], className)} {...rest}>
			{children}
		</div>
	);
}
