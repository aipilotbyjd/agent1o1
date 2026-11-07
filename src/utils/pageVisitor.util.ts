import safeStorage from '@/utils/safeStorage.util';

const KEY = 'page-visitor';

let fallback: string | null = null;

/**
 * A random id for this browser, sent with page requests so the server can
 * count unique visitors and keep each in one version of an A/B test. It
 * says nothing about who the visitor is; without storage it lasts the tab.
 */
export const pageVisitorId = (): string => {
	const stored = safeStorage.get(KEY);
	if (stored) return stored;
	const id = crypto.randomUUID();
	if (!safeStorage.set(KEY, id)) fallback ??= id;
	return fallback ?? id;
};

export const PAGE_VISITOR_HEADER = 'X-Page-Visitor';
