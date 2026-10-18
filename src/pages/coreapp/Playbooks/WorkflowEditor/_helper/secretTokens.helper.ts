/**
 * `{{ secrets.KEY }}` / `{{ vars.KEY }}` references to the workspace's
 * Secrets store. The backend resolves both prefixes against the same rows
 * (`SecretResolver`), loading only the keys a step's config names.
 */

/** The backend's rule for a key (`StoreSecretRequest`): what `{{ }}` can address. */
export const SECRET_KEY_RE = /^[A-Z][A-Z0-9_]*$/;

const SECRET_TOKEN_RE = /^\{\{\s*(secrets|vars)\.([A-Za-z][A-Za-z0-9_]*)\s*\}\}$/;
const SECRET_REF_RE = /\{\{\s*(?:secrets|vars)\.([A-Za-z][A-Za-z0-9_]*)[^}]*\}\}/g;

export const buildSecretToken = (key: string) => `{{ secrets.${key} }}`;

/** The key a whole `{{ secrets.KEY }}` token points at, or null. */
export const parseSecretToken = (token: string): string | null =>
	token.match(SECRET_TOKEN_RE)?.[2] ?? null;

/** Every secret key referenced anywhere in a config value. */
export const referencedSecretKeys = (value: unknown): string[] => {
	const keys = new Set<string>();
	const walk = (item: unknown) => {
		if (typeof item === 'string') {
			for (const match of item.matchAll(SECRET_REF_RE)) keys.add(match[1]);
		} else if (Array.isArray(item)) {
			item.forEach(walk);
		} else if (item && typeof item === 'object') {
			Object.values(item).forEach(walk);
		}
	};
	walk(value);
	return [...keys];
};

/** Typed text as a valid key: "openai api-key" → "OPENAI_API_KEY". */
export const toSecretKey = (text: string) =>
	text
		.toUpperCase()
		.replace(/[^A-Z0-9_]+/g, '_')
		.replace(/^[^A-Z]+/, '');
