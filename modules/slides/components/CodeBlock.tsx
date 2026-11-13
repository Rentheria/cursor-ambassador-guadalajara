'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button, cardInteractive } from '@/components/ui';

interface CodeBlockProps {
	code: string;
}

export default function CodeBlock({ code }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2_000);
		} catch (error) {
			console.error('Failed to copy code', error);
		}
	};

	return (
		<div className={`relative group ${cardInteractive}`}>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={handleCopy}
				className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
				aria-label="Copy code"
			>
				{copied ? <Check className="w-4 h-4 text-cursor-accent-green" /> : <Copy className="w-4 h-4" />}
			</Button>
			<pre className="p-5 md:p-6 overflow-x-auto">
				<code className="text-base md:text-lg font-sans text-cursor-text-secondary whitespace-pre-wrap">{code}</code>
			</pre>
		</div>
	);
}
