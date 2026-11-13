'use client';

import { useEffect, useState } from 'react';
import { cardInteractive } from '@/components/ui';

interface DiagramSlideProps {
	src: string;
	alt: string;
	caption?: string;
}

const CURSOR_FONT_STYLE = `<defs><style type="text/css">
@font-face{font-family:'CursorGothic';src:url('/fonts/CursorGothic-Regular.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap;}
@font-face{font-family:'CursorGothic';src:url('/fonts/CursorGothic-Bold.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap;}
text,tspan{font-family:CursorGothic,system-ui,sans-serif !important;}
</style></defs>`;

export default function DiagramSlide({ src, alt, caption }: DiagramSlideProps) {
	const [svgContent, setSvgContent] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);

	useEffect(() => {
		setIsLoading(true);
		fetch(src)
			.then((res) => {
				if (res.ok) return res.text();
				throw new Error(`Fetch failed: ${res.status}`);
			})
			.then((text) => {
				setSvgContent(text);
				setIsLoading(false);
			})
			.catch((err: Error) => {
				setFetchError(err.message);
				setIsLoading(false);
			});
	}, [src]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16 text-cursor-text-muted text-sm">Loading diagram…</div>
		);
	}

	if (fetchError) {
		return (
			<div className="bg-cursor-accent-red-bg border border-cursor-border-emphasis rounded-md p-4 text-cursor-accent-red text-center text-sm">
				<p>Error loading diagram: {fetchError}</p>
				<p className="text-cursor-text-muted mt-1 font-sans text-xs">{src}</p>
			</div>
		);
	}

	if (!svgContent) return null;

	const safeAlt = alt.replace(/"/g, '');
	const withFonts = svgContent
		.replace(/font-family="[^"]*"/g, 'font-family="CursorGothic, system-ui, sans-serif"')
		.replace(
			/<svg([^>]*)>/,
			`<svg$1 width="100%" height="auto" style="max-width:100%;display:block;font-family:CursorGothic,system-ui,sans-serif;" role="img" aria-label="${safeAlt}">${CURSOR_FONT_STYLE}`,
		);

	return (
		<div className="space-y-4">
			<div className={`${cardInteractive} p-4 md:p-6`}>
				<div dangerouslySetInnerHTML={{ __html: withFonts }} />
			</div>
			{caption ? (
				<p className="text-cursor-text-muted text-base md:text-lg text-center max-w-3xl mx-auto">{caption}</p>
			) : null}
		</div>
	);
}
