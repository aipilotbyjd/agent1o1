import safeStorage from '@/utils/safeStorage.util';
import type { TSignupAttribution } from '@/types/auth.type';

// ============================================================
// Signup attribution
// ------------------------------------------------------------
// Remembers where a visitor first came from (campaign tags, the
// site that sent them, the page they landed on and any
// `?template=` it pointed at) until they sign up. First touch
// wins: a later visit never overwrites it. Sent once, with the
// signup form or straight after a social signup, then cleared.
// ============================================================

const STORAGE_KEY = 'a1o1_signup_attribution';
const TTL_MS = 60 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

type TStored = { attribution: TSignupAttribution; saved_at: number };

/** The template a signup link pointed at, if any: the wizard offers it first. */
export const TEMPLATE_PARAM = 'template';

const read = (): TStored | null => {
	const raw = safeStorage.get(STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as TStored;
		if (Date.now() - parsed.saved_at > TTL_MS) {
			safeStorage.remove(STORAGE_KEY);
			return null;
		}
		return parsed;
	} catch {
		safeStorage.remove(STORAGE_KEY);
		return null;
	}
};

/** A visit from another site, as its host; links within the app say nothing. */
const externalReferrer = (): string | undefined => {
	if (!document.referrer) return undefined;
	try {
		const host = new URL(document.referrer).host;
		return host && host !== window.location.host ? host : undefined;
	} catch {
		return undefined;
	}
};

/**
 * Saves this visit as the first touch, unless one is already saved or the
 * visit carries nothing worth keeping.
 */
export const captureSignupAttribution = (search: string, pathname: string) => {
	if (read()) return;

	const params = new URLSearchParams(search);
	const attribution: TSignupAttribution = Object.fromEntries(
		UTM_KEYS.flatMap((key) => {
			const value = params.get(key)?.trim();
			return value ? [[key, value]] : [];
		}),
	);

	const template = params.get(TEMPLATE_PARAM)?.trim();
	const referrer = externalReferrer();
	if (template) attribution.template = template;
	if (referrer) attribution.referrer = referrer;
	if (Object.keys(attribution).length === 0) return;

	attribution.landing_path = pathname;
	safeStorage.set(
		STORAGE_KEY,
		JSON.stringify({ attribution, saved_at: Date.now() } satisfies TStored),
	);
};

export const getSignupAttribution = (): TSignupAttribution | null => read()?.attribution ?? null;

export const clearSignupAttribution = () => safeStorage.remove(STORAGE_KEY);
