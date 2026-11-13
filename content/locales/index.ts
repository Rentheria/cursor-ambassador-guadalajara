import en from './en.json';
import es from './es.json';

export const localeBundles = {
	es,
	en,
} as const;

export type LocaleBundleKey = keyof typeof localeBundles;
