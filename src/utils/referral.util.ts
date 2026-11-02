import type { TReferralUtm } from '@/types/referral.type';

// ============================================================
// Referral Attribution
// ------------------------------------------------------------
// Someone lands on a `?ref=` link (a referral share, or the "Made
// with Agent1o1" badge on a workflow page). The visit is recorded
// once, and the code plus the visitor id the API returns are kept
// here until signup sends them along, so the referrer is credited
// even if the visitor browses around before registering.
// ============================================================

const STORAGE_KEY = 'agent1o1.referral';

/** How long a landing still counts towards a later signup. */
const ATTRIBUTION_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

export type TStoredReferral = {
	code: string;
	visitor_id: string | null;
	captured_at: number;
};

export const readReferralParams = (
	search: string,
): { code: string; utm: TReferralUtm | null } | null => {
	const params = new URLSearchParams(search);
	const code = params.get('ref')?.trim();
	if (!code) return null;

	const utm: TReferralUtm = {};
	for (const key of UTM_KEYS) {
		const value = params.get(`utm_${key}`);
		if (value) utm[key] = value.slice(0, 255);
	}

	return { code: code.slice(0, 64), utm: Object.keys(utm).length > 0 ? utm : null };
};

export const getStoredReferral = (): TStoredReferral | null => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const stored = JSON.parse(raw) as TStoredReferral;
		if (!stored?.code || Date.now() - stored.captured_at > ATTRIBUTION_WINDOW_MS) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return stored;
	} catch {
		return null;
	}
};

export const storeReferral = (code: string, visitorId: string | null): void => {
	try {
		const value: TStoredReferral = { code, visitor_id: visitorId, captured_at: Date.now() };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {
		// Storage blocked: the code still rides along on this page's URL.
	}
};

export const clearStoredReferral = (): void => {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Nothing stored, nothing to clear.
	}
};
