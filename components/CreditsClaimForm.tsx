'use client';

import { FormEvent, useState } from 'react';
import { Button, cardBase } from '@/components/ui';
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

export default function CreditsClaimForm() {
	const { t } = useI18n();
	const [email, setEmail] = useState('');
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<ClaimResponse | null>(null);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPending(true);
		setResult(null);
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

	return (
		<div className="max-w-xl">
			<form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
				<label className="block flex-1">
					<span className="mb-2 block text-sm text-cursor-text-muted">{t('credits.emailLabel')}</span>
					<input
						type="email"
						name="email"
						autoComplete="email"
						inputMode="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder={t('credits.emailPlaceholder')}
						className="w-full rounded-sm border border-cursor-border bg-cursor-surface px-4 py-2.5 text-cursor-text placeholder:text-cursor-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor-accent-orange/60"
					/>
				</label>
				<Button type="submit" variant="accent" size="md" disabled={pending}>
					{pending ? t('credits.submitting') : t('credits.submit')}
				</Button>
			</form>

			{result?.status === 'ok' && result.credit ? (
				<div className={`${cardBase} mt-8 p-5`} data-testid="credits-success">
					<p className="cursor-eyebrow mb-2">{t('credits.successEyebrow')}</p>
					<h2 className="text-xl text-cursor-text">{t('credits.successHeading')}</h2>
					<p className="mt-2 text-sm text-cursor-text-muted">
						{result.reused ? t('credits.successReused') : t('credits.successBody')}
					</p>
					{looksLikeUrl(result.credit) ? (
						<a
							href={result.credit}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-4 inline-block break-all text-base text-cursor-accent-orange hover:underline"
							data-testid="credits-value"
						>
							{result.credit}
						</a>
					) : (
						<p className="mt-4 break-all font-mono text-lg text-cursor-text" data-testid="credits-value">
							{result.credit}
						</p>
					)}
				</div>
			) : null}

			{result?.status === 'not_registered' ? (
				<div className={`${cardBase} mt-8 p-5`} data-testid="credits-not-registered">
					<h2 className="text-xl text-cursor-text">{t('credits.notFoundHeading')}</h2>
					<p className="mt-2 text-sm leading-relaxed text-cursor-text-secondary">{t('credits.notFoundBody')}</p>
				</div>
			) : null}

			{result?.status === 'exhausted' ? (
				<div className={`${cardBase} mt-8 p-5`} data-testid="credits-exhausted">
					<h2 className="text-xl text-cursor-text">{t('credits.exhaustedHeading')}</h2>
					<p className="mt-2 text-sm leading-relaxed text-cursor-text-secondary">{t('credits.exhaustedBody')}</p>
				</div>
			) : null}

			{result?.status === 'invalid' ? (
				<p className="mt-4 text-sm text-cursor-text-muted" data-testid="credits-invalid">
					{t('credits.invalid')}
				</p>
			) : null}

			{result?.status === 'rate_limited' ? (
				<p className="mt-4 text-sm text-cursor-text-muted" data-testid="credits-rate-limited">
					{t('credits.rateLimited')}
				</p>
			) : null}

			{result?.status === 'unavailable' ? (
				<p className="mt-4 text-sm text-cursor-text-muted" data-testid="credits-unavailable">
					{t('credits.unavailable')}
				</p>
			) : null}

			{result?.status === 'forbidden' ? (
				<div className={`${cardBase} mt-8 p-5`} data-testid="credits-forbidden">
					<h2 className="text-xl text-cursor-text">{t('credits.needQrHeading')}</h2>
					<p className="mt-2 text-sm leading-relaxed text-cursor-text-secondary">{t('credits.needQrBody')}</p>
				</div>
			) : null}
		</div>
	);
}
