// ============================================================
// Page Visitor Id
// ------------------------------------------------------------
// A random id this browser keeps so a workflow page counts a
// visitor once a day (sent as `X-Page-Visitor`). The API only ever
// stores a keyed hash of it. Storage can be blocked (private mode,
// embeds with third-party storage off), so a per-tab id is the
// fallback rather than an error.
// ============================================================

const STORAGE_KEY = 'agent1o1.page_visitor';

let fallbackId: string | null = null;

const newId = (): string =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const getPageVisitorId = (): string => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return stored;

		const id = newId();
		localStorage.setItem(STORAGE_KEY, id);
		return id;
	} catch {
		fallbackId ??= newId();
		return fallbackId;
	}
};
