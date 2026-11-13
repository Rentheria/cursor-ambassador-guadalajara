'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button, cardBase, cardFeatured } from '@/components/ui';
import { CLAIM_MESSAGE_KEYS, claimUiPhase, isClaimMessageStatus, type ClaimUiStatus } from '@/lib/credits/claim-ui';
import { useI18n } from '@/lib/i18n';

type ClaimStatus = ClaimUiStatus;
type CreditPath = 'new' | 'existing';

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
	mode?: 'pool' | 'shared' | 'dual';
	needsPath?: boolean;
	path?: CreditPath | null;
};

function looksLikeUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

const swap = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -6 },
	transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] as const },
};

type CreditsClaimFormProps = {
	onOutcome?: (status: ClaimStatus | null) => void;
};

export default function CreditsClaimForm({ onOutcome }: CreditsClaimFormProps) {
	const { t } = useI18n();
	const [email, setEmail] = useState('');
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<ClaimResponse | null>(null);
	const [copied, setCopied] = useState(false);
	const focusForm = useRef(false);

	useEffect(() => {
		if (!copied) return undefined;
		const timer = window.setTimeout(() => setCopied(false), 1600);
		return () => window.clearTimeout(timer);
	}, [copied]);

	const headingRef = useCallback((node: HTMLHeadingElement | null) => {
		node?.focus();
	}, []);

	const emailRef = useCallback((node: HTMLInputElement | null) => {
		if (node && focusForm.current) {
			focusForm.current = false;
			node.focus();
		}
	}, []);

	async function postClaim(payload: { email: string; path?: CreditPath }) {
		const token = claimTokenFromBrowser();
		const response = await fetch('/api/credits/claim', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...payload, ...(token ? { token } : {}) }),
		});
		return (await response.json()) as ClaimResponse;
	}

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPending(true);
		setCopied(false);
		try {
			const body = await postClaim({ email });
			setResult(body);
			onOutcome?.(body.status);
		} catch {
			setResult({ status: 'unavailable' });
			onOutcome?.('unavailable');
		} finally {
			setPending(false);
		}
	}

	async function choosePath(path: CreditPath) {
		setPending(true);
		setCopied(false);
		try {
			const body = await postClaim({ email, path });
			setResult(body);
			onOutcome?.(body.status);
		} catch {
			setResult({ status: 'unavailable' });
			onOutcome?.('unavailable');
		} finally {
			setPending(false);
		}
	}

	function tryAnother() {
		focusForm.current = true;
		setResult(null);
		setCopied(false);
		onOutcome?.(null);
	}

	function switchPath() {
		setCopied(false);
		setResult((current) =>
			current
				? { ...current, needsPath: true, credit: undefined, status: 'ok', mode: current.mode ?? 'dual' }
				: current,
		);
	}

	async function copyCredit(value: string) {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}

	const phase = claimUiPhase(result?.status, { needsPath: result?.needsPath });
	const message =
		result && isClaimMessageStatus(result.status)
			? { heading: t(CLAIM_MESSAGE_KEYS[result.status].heading), body: t(CLAIM_MESSAGE_KEYS[result.status].body) }
			: null;
	const dualPath = result?.path === 'new' || result?.path === 'existing' ? result.path : null;
	const dualSteps =
		dualPath === 'new'
			? ['credits.dualNewStep1', 'credits.dualNewStep2', 'credits.dualNewStep3']
			: [
					'credits.dualExistingStep1',
					'credits.dualExistingStep2',
					'credits.dualExistingStep3',
					'credits.dualExistingStep4',
				];

	return (
		<div className="max-w-xl">
			<AnimatePresence mode="wait">
				{phase === 'form' ? (
					<motion.form
						key="form"
						{...swap}
						onSubmit={onSubmit}
						className={`${cardFeatured} p-5 sm:p-6`}
						data-testid="credits-form"
					>
						<h2 className="mb-4 text-lg text-cursor-text">{t('credits.heading')}</h2>
						<label className="block">
							<span className="mb-2 block text-sm text-cursor-text-muted">{t('credits.emailLabel')}</span>
							<input
								ref={emailRef}
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
						<Button
							type="submit"
							variant="accent"
							size="lg"
							disabled={pending}
							aria-busy={pending}
							className="mt-4 w-full"
						>
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
					</motion.form>
				) : phase === 'choose' ? (
					<motion.section
						key="choose"
						{...swap}
						className={`${cardFeatured} p-5 sm:p-7`}
						aria-live="polite"
						data-testid="credits-choose"
					>
						<p className="cursor-eyebrow">{t('credits.successEyebrow')}</p>
						<h2 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl text-cursor-text outline-none">
							{t('credits.dualQuestion')}
						</h2>
						<p className="mt-3 text-sm leading-relaxed text-cursor-text-secondary md:text-base">
							{t('credits.dualQuestionHelp')}
						</p>
						<div className="mt-6 flex flex-col gap-3">
							<Button
								type="button"
								variant="accent"
								size="lg"
								className="h-auto min-h-14 w-full whitespace-normal py-4 text-left"
								disabled={pending}
								onClick={() => void choosePath('existing')}
								data-testid="credits-path-existing"
							>
								{t('credits.dualExistingChoice')}
							</Button>
							<Button
								type="button"
								variant="primary"
								size="lg"
								className="h-auto min-h-14 w-full whitespace-normal py-4 text-left"
								disabled={pending}
								onClick={() => void choosePath('new')}
								data-testid="credits-path-new"
							>
								{t('credits.dualNewChoice')}
							</Button>
						</div>
					</motion.section>
				) : phase === 'success' && result?.credit ? (
					<motion.section
						key={`ok-${result.reused ? 'reused' : 'new'}-${result.path ?? 'code'}`}
						{...swap}
						className={`${cardFeatured} p-5 sm:p-7`}
						aria-live="polite"
						aria-atomic="true"
						data-testid="credits-success"
					>
						<div className="mb-5 flex items-center gap-3">
							<motion.span
								initial={{ opacity: 0, scale: 0.92 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
								className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cursor-accent-orange text-white"
								aria-hidden="true"
							>
								<Check className="size-5" strokeWidth={2.5} />
							</motion.span>
							<div>
								<p className="cursor-eyebrow">
									{result.reused ? t('credits.successReusedEyebrow') : t('credits.successEyebrow')}
								</p>
								<h2 ref={headingRef} tabIndex={-1} className="mt-1 text-2xl text-cursor-text outline-none">
									{result.mode === 'dual'
										? result.path === 'new'
											? t('credits.dualNewHeading')
											: t('credits.dualExistingHeading')
										: t('credits.successHeading')}
								</h2>
							</div>
						</div>
						{result.mode === 'dual' ? (
							<ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-cursor-text-secondary md:text-base">
								{dualSteps.map((key) => (
									<li key={key}>{t(key)}</li>
								))}
							</ol>
						) : (
							<p className="text-sm leading-relaxed text-cursor-text-secondary md:text-base">
								{result.reused ? t('credits.successReused') : t('credits.successBody')}
							</p>
						)}
						<div className="mt-6 rounded-sm border border-cursor-border bg-cursor-bg px-4 py-4">
							{looksLikeUrl(result.credit) ? (
								<a
									href={result.credit}
									target="_blank"
									rel="noopener noreferrer"
									className="block break-all font-mono text-base text-cursor-text hover:text-cursor-accent-orange"
									data-testid="credits-value"
								>
									{result.credit}
								</a>
							) : (
								<p className="break-all font-mono text-base text-cursor-text" data-testid="credits-value">
									{result.credit}
								</p>
							)}
						</div>
						<div className="mt-5 flex flex-col gap-3">
							<Button
								type="button"
								variant="accent"
								size="lg"
								className="w-full"
								onClick={() => void copyCredit(result.credit ?? '')}
								data-testid="credits-copy"
							>
								{copied ? <Check className="size-4" strokeWidth={2} /> : <Copy className="size-4" strokeWidth={2} />}
								{copied ? t('credits.copied') : t('credits.copy')}
							</Button>
							{looksLikeUrl(result.credit) ? (
								<Button href={result.credit} external variant="primary" size="lg" className="w-full">
									{t('credits.openLink')}
									<ExternalLink className="size-4" strokeWidth={2} aria-hidden="true" />
								</Button>
							) : null}
							{result.mode === 'dual' ? (
								<Button
									type="button"
									variant="secondary"
									size="lg"
									className="w-full"
									onClick={switchPath}
									data-testid="credits-switch-path"
								>
									{t('credits.dualSwitch')}
								</Button>
							) : null}
						</div>
					</motion.section>
				) : (
					<motion.section
						key={result?.status ?? 'message'}
						{...swap}
						className={`${cardBase} p-5 sm:p-7`}
						aria-live="polite"
						aria-atomic="true"
						data-testid={
							result && isClaimMessageStatus(result.status)
								? CLAIM_MESSAGE_KEYS[result.status].testId
								: 'credits-message'
						}
					>
						<h2 ref={headingRef} tabIndex={-1} className="text-2xl text-cursor-text outline-none">
							{message?.heading}
						</h2>
						<p className="mt-3 text-sm leading-relaxed text-cursor-text-secondary md:text-base">{message?.body}</p>
						<Button
							type="button"
							variant="secondary"
							size="lg"
							className="mt-6 w-full"
							onClick={tryAnother}
							data-testid="credits-try-another"
						>
							{t('credits.tryAnother')}
						</Button>
					</motion.section>
				)}
			</AnimatePresence>
		</div>
	);
}
