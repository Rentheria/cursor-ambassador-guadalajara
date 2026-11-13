'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, cardBase } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

type GuestRow = { email: string; name: string; approvalStatus?: string };
type ClaimedRow = GuestRow & { credit: string; claimedAt: string; path?: 'new' | 'existing' | null };
type FailedRow = { email: string; at: string; reason: string };
type CreditsMode = 'pool' | 'shared' | 'dual';

type AdminSummary = {
	mode: CreditsMode;
	storeKind: 'kv' | 'file';
	sharedLinkConfigured: boolean;
	stats: {
		guests: number;
		eligible: number;
		ineligible: number;
		claimed: number;
		unclaimed: number;
		remainingCodes: number | null;
		failedAttempts: number;
	};
	claimed: ClaimedRow[];
	unclaimed: GuestRow[];
	ineligible: GuestRow[];
	failed: FailedRow[];
};

export default function CreditsAdminPanel() {
	const { t } = useI18n();
	const [password, setPassword] = useState('');
	const [authed, setAuthed] = useState(false);
	const [error, setError] = useState('');
	const [summary, setSummary] = useState<AdminSummary | null>(null);
	const [mode, setMode] = useState<CreditsMode>('pool');
	const [sharedLink, setSharedLink] = useState('');
	const [saving, setSaving] = useState(false);

	const loadSummary = useCallback(async () => {
		const response = await fetch('/api/credits/admin', { cache: 'no-store' });
		if (response.status === 401) {
			setAuthed(false);
			return;
		}
		if (!response.ok) {
			setError(t('credits.adminLoadError'));
			return;
		}
		const body = (await response.json()) as AdminSummary;
		setSummary(body);
		setMode(body.mode);
		setAuthed(true);
	}, [t]);

	useEffect(() => {
		void loadSummary();
	}, [loadSummary]);

	async function onLogin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		const response = await fetch('/api/credits/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password }),
		});
		if (!response.ok) {
			setError(t('credits.adminBadPassword'));
			return;
		}
		setPassword('');
		await loadSummary();
	}

	async function onLogout() {
		await fetch('/api/credits/admin/logout', { method: 'POST' });
		setAuthed(false);
		setSummary(null);
	}

	async function onUpload(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError('');
		const form = event.currentTarget;
		const data = new FormData(form);
		data.set('mode', mode);
		data.set('sharedLink', sharedLink);
		const response = await fetch('/api/credits/admin', { method: 'POST', body: data });
		setSaving(false);
		if (!response.ok) {
			setError(t('credits.adminSaveError'));
			return;
		}
		const body = (await response.json()) as AdminSummary;
		setSummary(body);
		form.reset();
	}

	async function downloadExport(kind: 'claimed' | 'unclaimed' | 'failed') {
		const response = await fetch('/api/credits/admin/export', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ kind }),
		});
		if (!response.ok) {
			setError(t('credits.adminLoadError'));
			return;
		}
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `credits-${kind}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	if (!authed) {
		return (
			<form onSubmit={onLogin} className="max-w-sm" data-testid="admin-login">
				<label className="block">
					<span className="mb-2 block text-sm text-cursor-text-muted">{t('credits.adminPassword')}</span>
					<input
						type="password"
						name="password"
						autoComplete="current-password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="w-full rounded-sm border border-cursor-border bg-cursor-surface px-4 py-2.5 text-cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cursor-accent-orange/60"
					/>
				</label>
				<div className="mt-4">
					<Button type="submit" variant="primary" size="md">
						{t('credits.adminEnter')}
					</Button>
				</div>
				{error ? <p className="mt-3 text-sm text-cursor-text-muted">{error}</p> : null}
			</form>
		);
	}

	return (
		<div data-testid="admin-dashboard">
			<div className="mb-8 flex flex-wrap items-center justify-between gap-3">
				<p className="text-sm text-cursor-text-muted">
					{t('credits.adminStore')}: {summary?.storeKind} · {t('credits.adminMode')}: {summary?.mode}
				</p>
				<div className="flex flex-wrap gap-2">
					<Button href="/creditos/qr" variant="secondary" size="sm">
						{t('credits.qrCta')}
					</Button>
					<Button type="button" variant="secondary" size="sm" onClick={() => void onLogout()}>
						{t('credits.adminLogout')}
					</Button>
				</div>
			</div>

			<div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				<Stat label={t('credits.statEligible')} value={summary?.stats.eligible ?? 0} />
				<Stat label={t('credits.statClaimed')} value={summary?.stats.claimed ?? 0} />
				<Stat label={t('credits.statUnclaimed')} value={summary?.stats.unclaimed ?? 0} />
				<Stat
					label={t('credits.statRemaining')}
					value={summary?.stats.remainingCodes === null ? '∞' : (summary?.stats.remainingCodes ?? 0)}
				/>
				<Stat label={t('credits.statFailed')} value={summary?.stats.failedAttempts ?? 0} />
				<Stat label={t('credits.statIneligible')} value={summary?.stats.ineligible ?? 0} />
			</div>

			<form onSubmit={onUpload} className={`${cardBase} mb-10 space-y-5 p-5`}>
				<p className="cursor-eyebrow">{t('credits.adminLoadEyebrow')}</p>
				<h2 className="text-xl text-cursor-text">{t('credits.adminLoadHeading')}</h2>
				<p className="text-sm text-cursor-text-secondary">{t('credits.adminLoadHelp')}</p>

				<label className="block text-sm text-cursor-text-muted">
					{t('credits.adminGuestsFile')}
					<input
						type="file"
						name="guests"
						accept=".csv,text/csv,text/plain"
						className="mt-2 block w-full text-sm text-cursor-text"
					/>
				</label>

				<div className="flex flex-wrap gap-3">
					<label className="flex items-center gap-2 text-sm text-cursor-text">
						<input type="radio" name="modeChoice" checked={mode === 'pool'} onChange={() => setMode('pool')} />
						{t('credits.modePool')}
					</label>
					<label className="flex items-center gap-2 text-sm text-cursor-text">
						<input type="radio" name="modeChoice" checked={mode === 'shared'} onChange={() => setMode('shared')} />
						{t('credits.modeShared')}
					</label>
					<label className="flex items-center gap-2 text-sm text-cursor-text">
						<input type="radio" name="modeChoice" checked={mode === 'dual'} onChange={() => setMode('dual')} />
						{t('credits.modeDual')}
					</label>
				</div>
				{mode === 'dual' ? <p className="text-sm text-cursor-text-secondary">{t('credits.adminDualHelp')}</p> : null}

				<label className="block text-sm text-cursor-text-muted">
					{t('credits.adminPoolFile')}
					<input
						type="file"
						name="pool"
						accept=".txt,.csv,text/plain"
						className="mt-2 block w-full text-sm text-cursor-text"
					/>
				</label>

				<label className="block text-sm text-cursor-text-muted">
					{t('credits.adminSharedLink')}
					<input
						type="url"
						name="sharedLinkVisible"
						value={sharedLink}
						onChange={(event) => setSharedLink(event.target.value)}
						placeholder="https://..."
						className="mt-2 w-full rounded-sm border border-cursor-border bg-cursor-bg px-4 py-2.5 text-cursor-text"
					/>
				</label>

				<Button type="submit" variant="accent" size="md" disabled={saving}>
					{saving ? t('credits.adminSaving') : t('credits.adminSave')}
				</Button>
				{error ? <p className="text-sm text-cursor-text-muted">{error}</p> : null}
			</form>

			<div className="mb-8 flex flex-wrap gap-3">
				<Button type="button" variant="secondary" size="sm" onClick={() => void downloadExport('claimed')}>
					{t('credits.exportClaimed')}
				</Button>
				<Button type="button" variant="secondary" size="sm" onClick={() => void downloadExport('unclaimed')}>
					{t('credits.exportUnclaimed')}
				</Button>
				<Button type="button" variant="secondary" size="sm" onClick={() => void downloadExport('failed')}>
					{t('credits.exportFailed')}
				</Button>
			</div>

			<AdminTable
				title={t('credits.claimedHeading')}
				empty={t('credits.emptyClaimed')}
				headers={[
					t('credits.colName'),
					t('credits.colEmail'),
					t('credits.colPath'),
					t('credits.colCredit'),
					t('credits.colWhen'),
				]}
				rows={(summary?.claimed ?? []).map((row) => [
					row.name,
					row.email,
					row.path === 'new'
						? t('credits.pathNew')
						: row.path === 'existing'
							? t('credits.pathExisting')
							: t('credits.pathPending'),
					row.credit,
					row.claimedAt,
				])}
				testId="admin-claimed"
			/>
			<AdminTable
				title={t('credits.unclaimedHeading')}
				empty={t('credits.emptyUnclaimed')}
				headers={[t('credits.colName'), t('credits.colEmail'), t('credits.colStatus')]}
				rows={(summary?.unclaimed ?? []).map((row) => [row.name, row.email, row.approvalStatus ?? ''])}
				testId="admin-unclaimed"
			/>
			<AdminTable
				title={t('credits.failedHeading')}
				empty={t('credits.emptyFailed')}
				headers={[t('credits.colEmail'), t('credits.colWhen'), t('credits.colReason')]}
				rows={(summary?.failed ?? []).map((row) => [row.email, row.at, row.reason])}
				testId="admin-failed"
			/>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className={`${cardBase} p-4`}>
			<p className="text-xs uppercase tracking-wide text-cursor-text-muted">{label}</p>
			<p className="mt-1 text-2xl text-cursor-text">{value}</p>
		</div>
	);
}

function AdminTable({
	title,
	empty,
	headers,
	rows,
	testId,
}: {
	title: string;
	empty: string;
	headers: string[];
	rows: string[][];
	testId: string;
}) {
	return (
		<section className="mb-12" data-testid={testId}>
			<div className="mb-3 flex items-center gap-2">
				<h2 className="text-xl text-cursor-text">{title}</h2>
				<Badge variant="neutral">{rows.length}</Badge>
			</div>
			{rows.length === 0 ? (
				<p className="text-sm text-cursor-text-muted">{empty}</p>
			) : (
				<div className="overflow-x-auto border-t border-cursor-border">
					<table className="min-w-full text-left text-sm">
						<thead>
							<tr className="border-b border-cursor-border text-cursor-text-muted">
								{headers.map((header) => (
									<th key={header} className="px-3 py-2 font-normal">
										{header}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.join('|')} className="border-b border-cursor-border">
									{row.map((cell, index) => (
										<td key={`${row[0]}-${index}`} className="max-w-xs break-all px-3 py-2 text-cursor-text">
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
