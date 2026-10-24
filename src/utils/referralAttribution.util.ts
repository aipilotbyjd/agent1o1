import safeStorage from '@/utils/safeStorage.util';

// ============================================================
// Referral attribution
// ------------------------------------------------------------
// Remembers the `?ref=` link a visitor arrived through until they
// sign up, so the signup (or, for a social signup, the claim right
// after it) can be credited to the right referrer. Last click wins.
// The backend re-checks the program's own attribution window, so
// this TTL only decides when we stop sending a stale code.
// ============================================================

const STORAGE_KEY = 'a1o1_referral';
const TTL_MS = 60 * 24 * 60 * 60 * 1000;

export type TReferralAttribution = {
	code: string;
	visitor_id?: string;
	saved_at: number;
};

export const saveReferralAttribution = (code: string, visitorId?: string) => {
	safeStorage.set(
		STORAGE_KEY,
		JSON.stringify({
			code,
			visitor_id: visitorId,
			saved_at: Date.now(),
		} satisfies TReferralAttribution),
	);
};

export const getReferralAttribution = (): TReferralAttribution | null => {
	const raw = safeStorage.get(STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as TReferralAttribution;
		if (!parsed.code || Date.now() - parsed.saved_at > TTL_MS) {
			safeStorage.remove(STORAGE_KEY);
			return null;
		}
		return parsed;
	} catch {
		safeStorage.remove(STORAGE_KEY);
		return null;
	}
};

export const clearReferralAttribution = () => safeStorage.remove(STORAGE_KEY);
