import 'server-only';

import { readFile, writeFile } from 'node:fs/promises';
import { bootstrapStateFromEnv, creditsStoreKind, ensureStoreDir, getCreditsRuntimeConfig } from './config';
import { createCreditsState } from './assign';
import { kvFetch, withKvLock } from './kv';
import type { CreditsState } from './types';

const KV_KEY = 'credits:store';

type QueueTask<T> = () => Promise<T>;

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: QueueTask<T>): Promise<T> {
	const run = queue.then(task, task);
	queue = run.then(
		() => undefined,
		() => undefined,
	);
	return run;
}

function isCreditsState(value: unknown): value is CreditsState {
	if (!value || typeof value !== 'object') return false;
	const record = value as CreditsState;
	return record.version === 1 && Array.isArray(record.guests) && Array.isArray(record.assignments);
}

function normalizeState(value: unknown): CreditsState {
	if (!isCreditsState(value)) return createCreditsState();
	return createCreditsState(value);
}

function isUninitialized(state: CreditsState): boolean {
	return state.guests.length === 0 && state.pool.length === 0 && !state.sharedLink && state.assignments.length === 0;
}

async function readKv(): Promise<CreditsState | null> {
	const payload = await kvFetch(['GET', KV_KEY]);
	if (typeof payload.result !== 'string' || !payload.result) return null;
	try {
		return normalizeState(JSON.parse(payload.result));
	} catch {
		return null;
	}
}

async function writeKv(state: CreditsState): Promise<void> {
	await kvFetch(['SET', KV_KEY, JSON.stringify(state)]);
}

async function readFileStore(): Promise<CreditsState | null> {
	const { storePath } = getCreditsRuntimeConfig();
	try {
		const raw = await readFile(storePath, 'utf8');
		return normalizeState(JSON.parse(raw));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
}

async function writeFileStore(state: CreditsState): Promise<void> {
	const { storePath } = getCreditsRuntimeConfig();
	await ensureStoreDir(storePath);
	await writeFile(storePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function readRaw(): Promise<CreditsState | null> {
	return creditsStoreKind() === 'kv' ? readKv() : readFileStore();
}

async function writeRaw(state: CreditsState): Promise<void> {
	if (creditsStoreKind() === 'kv') {
		await writeKv(state);
		return;
	}
	await writeFileStore(state);
}

async function mutateState(
	mutator: (state: CreditsState) => CreditsState | Promise<CreditsState>,
): Promise<CreditsState> {
	const existing = await readRaw();
	const current = existing && !isUninitialized(existing) ? existing : await bootstrapStateFromEnv();
	const next = await mutator(current);
	await writeRaw(next);
	return next;
}

async function loadState(): Promise<CreditsState> {
	const existing = await readRaw();
	if (existing && !isUninitialized(existing)) return existing;
	const bootstrapped = await bootstrapStateFromEnv();
	if (!isUninitialized(bootstrapped)) {
		await writeRaw(bootstrapped);
		return bootstrapped;
	}
	return existing ?? createCreditsState();
}

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
	if (creditsStoreKind() === 'kv') return withKvLock(task);
	return enqueue(task);
}

export async function loadCreditsState(): Promise<CreditsState> {
	return runExclusive(loadState);
}

export async function saveCreditsState(state: CreditsState): Promise<void> {
	await runExclusive(async () => {
		await writeRaw(state);
	});
}

export async function updateCreditsState(
	mutator: (state: CreditsState) => CreditsState | Promise<CreditsState>,
): Promise<CreditsState> {
	return runExclusive(() => mutateState(mutator));
}
