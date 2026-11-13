import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonBase, buttonSizes, buttonVariants, type ButtonSize, type ButtonVariant } from './button-styles';
import { cn } from './cn';

type Shared = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
	children: ReactNode;
};

type NativeButtonProps = Shared &
	Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Shared> & {
		href?: undefined;
		external?: undefined;
	};

type AnchorButtonProps = Shared &
	Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Shared | 'href'> & {
		href: string;
		/** Open in a new tab with noopener */
		external?: boolean;
	};

export type ButtonProps = NativeButtonProps | AnchorButtonProps;

function buttonClassName(variant: ButtonVariant, size: ButtonSize, className?: string) {
	return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

/**
 * Polymorphic pill button.
 * - no `href` → `<button>`
 * - `href` + `external` → `<a target="_blank">`
 * - `href` without external → Next.js `<Link>`
 */
export function Button(props: ButtonProps) {
	const variant = props.variant ?? 'primary';
	const size = props.size ?? 'md';
	const className = buttonClassName(variant, size, props.className);

	if (props.href === undefined) {
		const { variant: _v, size: _s, className: _c, children, type, href: _h, external: _e, ...rest } = props;
		return (
			<button type={type ?? 'button'} className={className} {...rest}>
				{children}
			</button>
		);
	}

	const { href, children, className: _c, variant: _v, size: _s, external, ...rest } = props;

	if (external) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
				{children}
			</a>
		);
	}

	return (
		<Link href={href} className={className} {...rest}>
			{children}
		</Link>
	);
}
