import type { ReactNode } from 'react';
import { cn } from '@/components/ui';

type SlideTitleProps = {
	children: ReactNode;
	className?: string;
	centered?: boolean;
};

export function SlideTitle({ children, className, centered }: SlideTitleProps) {
	return (
		<h2
			className={cn(
				'text-3xl md:text-5xl font-normal tracking-tight text-cursor-text',
				centered && 'text-center',
				className,
			)}
		>
			{children}
		</h2>
	);
}

type SlideBodyProps = {
	children: ReactNode;
	className?: string;
};

export function SlideBody({ children, className }: SlideBodyProps) {
	return <div className={cn('space-y-6', className)}>{children}</div>;
}

type SlideGridProps = {
	children: ReactNode;
	cols?: 1 | 2 | 3;
	className?: string;
};

export function SlideGrid({ children, cols = 2, className }: SlideGridProps) {
	const colClass =
		cols === 3 ? 'grid-cols-1 md:grid-cols-3' : cols === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';
	return <div className={cn('grid gap-6', colClass, className)}>{children}</div>;
}

type SlideCalloutVariant = 'blue' | 'green' | 'purple' | 'yellow' | 'orange' | 'neutral';

const calloutStyles: Record<SlideCalloutVariant, string> = {
	blue: 'bg-cursor-accent-blue-bg border-cursor-border-emphasis',
	green: 'bg-cursor-accent-green-bg border-cursor-border-emphasis',
	purple: 'bg-cursor-accent-purple-bg border-cursor-border-emphasis',
	yellow: 'bg-cursor-accent-yellow-bg border-cursor-border-emphasis',
	orange: 'bg-cursor-accent-orange-bg border-cursor-border-emphasis',
	neutral: 'bg-cursor-overlay border-cursor-border',
};

type SlideCalloutProps = {
	children: ReactNode;
	variant?: SlideCalloutVariant;
	className?: string;
};

export function SlideCallout({ children, variant = 'neutral', className }: SlideCalloutProps) {
	return (
		<div className={cn('rounded-md border p-5 md:p-6 transition-colors', calloutStyles[variant], className)}>
			{children}
		</div>
	);
}

type SlideListItemProps = {
	index: number;
	label: string;
	desc?: string;
};

export function SlideListItem({ index, label, desc }: SlideListItemProps) {
	return (
		<div className="flex items-start gap-4 text-lg md:text-xl">
			<span className="text-cursor-accent-blue text-sm mt-1 shrink-0 tabular-nums">
				{String(index).padStart(2, '0')}
			</span>
			<div>
				<span className="text-cursor-text">{label}</span>
				{desc ? <span className="text-cursor-text-muted ml-2">— {desc}</span> : null}
			</div>
		</div>
	);
}

type SlideFootnoteProps = {
	children: ReactNode;
};

export function SlideFootnote({ children }: SlideFootnoteProps) {
	return <p className="text-sm md:text-base text-cursor-text-faint text-center max-w-3xl mx-auto">{children}</p>;
}

/** Full-viewport title card (welcome / thank-you). Put brand, one headline, one footer. */
type TitleCardProps = {
	eyebrow?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	footer?: ReactNode;
};

export function TitleCard({ eyebrow, title, subtitle, footer }: TitleCardProps) {
	return (
		<div className="w-full flex-1 min-h-[calc(100vh-6rem)] flex flex-col justify-between py-10 md:py-14">
			<div>{eyebrow}</div>
			<div className="max-w-4xl">
				<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-cursor-text leading-[1.02]">
					{title}
				</h1>
				{subtitle ? <div className="mt-8 text-xl md:text-2xl text-cursor-text-muted max-w-lg">{subtitle}</div> : null}
			</div>
			<div>{footer}</div>
		</div>
	);
}
