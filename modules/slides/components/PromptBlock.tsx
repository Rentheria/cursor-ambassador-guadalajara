'use client';

import { useState } from 'react';
import { Copy, Check, PenLine } from 'lucide-react';
import { Button } from '@/components/ui';
import { SlideCallout } from './primitives';

interface PromptBlockProps {
	prompt: string;
	label?: string;
}

export default function PromptBlock({ prompt, label = 'Try this in Cursor' }: PromptBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(prompt);
			setCopied(true);
			setTimeout(() => setCopied(false), 2_000);
		} catch (error) {
			console.error('Failed to copy prompt', error);
		}
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-cursor-accent-blue text-sm font-medium">
				<PenLine className="w-4 h-4" />
				<span>{label}</span>
			</div>
			<SlideCallout variant="blue" className="relative group p-0 overflow-hidden">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleCopy}
					className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
					aria-label="Copy prompt"
				>
					{copied ? <Check className="w-4 h-4 text-cursor-accent-green" /> : <Copy className="w-4 h-4" />}
				</Button>
				<pre className="p-5 md:p-6 overflow-x-auto border-0 bg-transparent">
					<code className="text-base md:text-lg font-sans text-cursor-text-secondary whitespace-pre-wrap">
						{prompt}
					</code>
				</pre>
			</SlideCallout>
		</div>
	);
}
