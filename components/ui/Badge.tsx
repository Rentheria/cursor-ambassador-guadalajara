import type { HTMLAttributes, ReactNode } from 'react';
import { badgeBase, badgeVariants, type BadgeVariant } from './badge-styles';
import { cn } from './cn';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
	variant?: BadgeVariant;
	children: ReactNode;
};

export function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
	return (
		<span className={cn(badgeBase, badgeVariants[variant], className)} {...rest}>
			{children}
		</span>
	);
}
