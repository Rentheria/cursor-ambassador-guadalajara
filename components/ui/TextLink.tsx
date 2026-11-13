import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { textLinkBase, textLinkCaret, textLinkMuted } from './text-link-styles';
import { cn } from './cn';

type TextLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> & {
	href: string;
	children: ReactNode;
	/** Show trailing directional glyph (→ internal, ↗ external; default true) */
	caret?: boolean;
	/** Muted secondary style instead of orange accent */
	muted?: boolean;
	external?: boolean;
	className?: string;
};

export function TextLink({
	href,
	children,
	caret = true,
	muted = false,
	external = false,
	className,
	...rest
}: TextLinkProps) {
	const classes = cn(muted ? textLinkMuted : textLinkBase, className);
	const content = (
		<>
			{children}
			{caret ? (
				<span className={textLinkCaret} aria-hidden="true">
					{external ? '↗' : '→'}
				</span>
			) : null}
		</>
	);

	if (external) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
				{content}
			</a>
		);
	}

	return (
		<Link href={href} className={classes} {...rest}>
			{content}
		</Link>
	);
}
