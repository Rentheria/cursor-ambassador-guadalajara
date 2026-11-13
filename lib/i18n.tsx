'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { siteConfig } from '@/content/site.config';
import { localeBundles } from '@/content/locales';

interface TranslationTree {
	[key: string]: string | TranslationTree;
}

const TRANSLATION_BUNDLES_BY_LOCALE: Record<string, TranslationTree> = {
	...Object.fromEntries(Object.entries(localeBundles).map(([locale, bundle]) => [locale, bundle as TranslationTree])),
};

interface I18nContextType {
	locale: string;
	setLocale: (locale: string) => void;
	t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

type I18nProviderProps = {
	children: ReactNode;
};

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
	const [locale, setLocaleState] = useState<string>(siteConfig.defaultLocale);

	useEffect(() => {
		const savedLocale = localStorage.getItem('locale');
		if (savedLocale && siteConfig.locales.includes(savedLocale)) {
			setLocaleState(savedLocale);
		}
	}, []);

	const setLocale = (nextLocale: string) => {
		if (!siteConfig.locales.includes(nextLocale)) {
			return;
		}
		setLocaleState(nextLocale);
		localStorage.setItem('locale', nextLocale);
	};

	const t = (key: string, params?: Record<string, string>): string => {
		const keys = key.split('.');
		const lookup = (bundle: TranslationTree | undefined): string | undefined => {
			if (!bundle) return undefined;
			let value: string | TranslationTree | undefined = bundle;
			for (const k of keys) {
				if (typeof value !== 'object' || value === null) {
					return undefined;
				}
				value = value[k];
			}
			return typeof value === 'string' ? value : undefined;
		};

		const resolved =
			lookup(TRANSLATION_BUNDLES_BY_LOCALE[locale]) ??
			lookup(TRANSLATION_BUNDLES_BY_LOCALE[siteConfig.defaultLocale]) ??
			lookup(TRANSLATION_BUNDLES_BY_LOCALE.en);

		if (!resolved) {
			return key;
		}

		if (!params) {
			return resolved;
		}

		return resolved.replace(/\{(\w+)\}/g, (match, paramKey) => params[paramKey] ?? match);
	};

	return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
};

export function useI18n() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error('useI18n must be used within I18nProvider');
	}

	return context;
}
