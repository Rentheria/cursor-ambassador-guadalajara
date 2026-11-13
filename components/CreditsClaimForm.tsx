'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button, cardBase, cardFeatured } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

type ClaimStatus = 'ok' | 'invalid' | 'not_registered' | 'exhausted' | 'unavailable' | 'rate_limited' | 'forbidden';

function claimTokenFromBrowser(): string {
	if (typeof window === 'undefined') return '';
	const fromQuery = new URLSearchParams(window.location.search).get('k') ?? '';
	if (fromQuery) {
		try {
			sessionStorage.setItem('credits-claim-k', fromQuery);
		} catch {
			// private mode / blocked storage
		}
		return fromQuery;
	}
	try {
		return sessionStorage.getItem('credits-claim-k') ?? '';
	} catch {
		return '';
	}
}

type ClaimResponse = {
	status: ClaimStatus;
	credit?: string;
	reused?: boolean;
};

function looksLikeUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

const enter = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 4 },
	transition: { duration: 0.18, ease: [0.25, 1, 0.5, 1] as const },
};

export default function CreditsClaimForm() {
	const { t } = useI18n();
	const [email, setEmail] = useState('');
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<ClaimResponse | null>(null);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return undefined;
		const timer = window.setTimeout(() => setCopied(false), 1600);
		return () => window.clearTimeout(timer);
	}, [copied]);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPending(true);
		setCopied(false);
		try {
			const token = claimTokenFromBrowser();
			const response = await fetch('/api/credits/claim', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, ...(token ? { token } : {}) }),
			});
			const body = (await response.json()) as ClaimResponse;
			setResult(body);
		} catch {
			setResult({ status: 'unavailable' });
		} finally {
			setPending(false);
		}
	}

	async function copyCredit(value: string) {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}

	return (
		<div className="max-w-xl">
			<form onSubmit={onSubmit} className={`${cardFeatured} p-5 sm:p-6`}>
				<h2 className="mb-4 text-lg text-cursor-text">{t('credits.heading')}</h2>
				<label className="block">
					<span className="mb-2 block text-sm text-cursor-text-muted">{t('credits.emailLabel')}</span>
					<input
						type="email"
						name="email"
						autoComplete="email"
						inputMode="email"
						autoCapitalize="none"
						autoCorrect="off"
						spellCheck={false}
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder={t('credits.emailPlaceholder')}
						className="w-full rounded-sm border border-cursor-border bg-cursor-bg px-4 py-3.5 text-base text-cursor-text placeholder:text-cursor-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor-accent-orange/60"
					/>
				</label>
				<Button type="submit" variant="accent" size="lg" disabled={pending} aria-busy={pending} className="mt-4 w-full">
					{pending ? (
						<span className="inline-flex items-center gap-2">
							<span
								className="size-4 rounded-full border-2 border-white/35 border-t-white motion-safe:animate-spin"
								aria-hidden="true"
							/>
							{t('credits.submitting')}
						</span>
					) : (
						t('credits.submit')
					)}
				</Button>
			</form>

			<div className="mt-5" aria-live="polite">
				<AnimatePresence mode="wait">
					{result?.status === 'ok' && result.credit ? (
						<motion.div
							key={`ok-${result.reused ? 'reused' : 'new'}`}
							{...enter}
							className={`${cardFeatured} p-5 sm:p-6`}
							data-testid="credits-success"
						>
							<div className="mb-4 flex items-center gap-3">
								<motion.span
									initial={{ opacity: 0, scale: 0.92 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
									className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cursor-accent-orange text-white"
									aria-hidden="true"
								>
									<Check className="size-4" strokeWidth={2.5} />
								</motion.span>
								<div>
									<p className="cursor-eyebrow">
										{result.reused ? t('credits.successReusedEyebrow') : t('credits.successEyebrow')}
									</p>
									<h2 className="mt-1 text-xl text-cursor-text">{t('credits.successHeading')}</h2>
								</div>
							</div>
							<p className="text-sm leading-relaxed text-cursor-text-muted">
								{result.reused ? t('credits.successReused') : t('credits.successBody')}
							</p>
							<div className="mt-5 rounded-sm border border-cursor-border bg-cursor-bg px-4 py-3">
								{looksLikeUrl(result.credit) ? (
									<a
										href={result.credit}
										target="_blank"
										rel="noopener noreferrer"
										className="block break-all font-mono text-sm text-cursor-text hover:text-cursor-accent-orange"
										data-testid="credits-value"
									>
										{result.credit}
									</a>
								) : (
									<p className="break-all font-mono text-sm text-cursor-text" data-testid="credits-value">
										{result.credit}
									</p>
								)}
							</div>
							<div className="mt-4 flex flex-col gap-2 sm:flex-row">
								<Button
									type="button"
									variant="secondary"
									size="md"
									className="w-full sm:w-auto"
									onClick={() => void copyCredit(result.credit ?? '')}
									data-testid="credits-copy"
								>
									{copied ? <Check className="size-4" strokeWidth={2} /> : <Copy className="size-4" strokeWidth={2} />}
									{copied ? t('credits.copied') : t('credits.copy')}
								</Button>
								{looksLikeUrl(result.credit) ? (
									<Button href={result.credit} external variant="accent" size="md" className="w-full sm:w-auto">
										{t('credits.openLink')}
										<ExternalLink className="size-4" strokeWidth={2} aria-hidden="true" />
									</Button>
								) : null}
							</div>
						</motion.div>
					) : null}

					{result?.status === 'not_registered' ? (
						<motion.div
							key="not-registered"
							{...enter}
							className={`${cardBase} p-5 sm:p-6`}
							data-testid="credits-not-registered"
						>
							<h2 className="text-xl text-cursor-text">{t('credits.notFoundHeading')}</h2>
							<p className="mt-2 text-sm leading-relaxed text-cursor-text-secondary">{t('credits.notFoundBody')}</p>
						</motion.div>
					) : null}

					{result?.status === 'exhausted' ? (
						<motion.div key="exhausted" {...enter} className={`${cardBase} p-5 sm:p-6`} data-testid="credits-exhausted">
							<h2 className="text-xl text-cursor-text">{t('credits.exhaustedHeading')}</h2>
							<p className="mt-2 text-sm leading-relaxed text-cursor-text-secondary">{t('credits.exhaustedBody')}</p>
						</motion.div>
					) : null}

					{result?.status === 'invalid' ? (
						<motion.p
							key="invalid"
							{...enter}
							className="px-1 text-sm text-cursor-text-muted"
							data-testid="credits-invalid"
						>
							{t('credits.invalid')}
						</motion.p>
					) : null}

					{result?.status === 'rate_limited' ? (
						<motion.p
							key="rate-limited"
							{...enter}
							className="px-1 text-sm text-cursor-text-muted"
							data-testid="credits-rate-limited"
						>
							{t('credits.rateLimited')}
						</motion.p>
					) : null}

					{result?.status === 'unavailable' ? (
						<motion.p
							key="unavailable"
							{...enter}
							className="px-1 text-sm text-cursor-text-muted"
							data-testid="credits-unavailable"
						>
							{t('credits.unavailable')}
						</motion.p>
					) : null}

					{result?.status === 'forbidden' ? (
						<motion.div key="forbidden" {...enter} className={`${cardBase} p-5 sm:p-6`} data-testid="credits-forbidden">
							<h2 className="text-xl text-cursor-text">{t('credits.needQrHeading')}</h2>
							<p className="mt-2 text-sm leading-relaxed text-cursor-text-secondary">{t('credits.needQrBody')}</p>
						</motion.div>
					) : null}
				</AnimatePresence>
			</div>
		</div>
	);
}
