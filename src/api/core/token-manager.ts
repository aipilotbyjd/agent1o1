// ============================================================
// Token Manager
// ------------------------------------------------------------
// Stores the access token and its expiry in localStorage or
// sessionStorage, based on remember-me preference. The refresh
// token itself is never stored here — the backend issues it as an
// httpOnly cookie and reads it back the same way, so the client
// never sees it.
// ============================================================

import safeStorage from '@/utils/safeStorage.util';

const TOKEN_KEYS = {
	ACCESS_TOKEN: 'a1o1_access_token',
	TOKEN_EXPIRY: 'a1o1_token_expiry',
	REMEMBER_ME: 'a1o1_remember_me',
} as const;

export const TOKEN_CHANGE_EVENT = 'a1o1_token_change';

const dispatchTokenChange = () => {
	window.dispatchEvent(new CustomEvent(TOKEN_CHANGE_EVENT));
};

// ─── Getters ─────────────────────────────────────────────────

export const getAccessToken = (): string | null =>
	safeStorage.get(TOKEN_KEYS.ACCESS_TOKEN) || safeStorage.get(TOKEN_KEYS.ACCESS_TOKEN, 'session');

export const getTokenExpiry = (): number | null => {
	const expiry =
		safeStorage.get(TOKEN_KEYS.TOKEN_EXPIRY) ||
		safeStorage.get(TOKEN_KEYS.TOKEN_EXPIRY, 'session');
	return expiry ? parseInt(expiry, 10) : null;
};

export const isRememberMe = (): boolean => safeStorage.get(TOKEN_KEYS.REMEMBER_ME) === 'true';

// ─── Setters ─────────────────────────────────────────────────

const clearTokensRaw = (): void => {
	Object.values(TOKEN_KEYS).forEach((key) => {
		safeStorage.remove(key);
		safeStorage.remove(key, 'session');
	});
};

// Deliberately not safeStorage: a token that cannot be stored must fail the login loudly,
// not leave the user silently signed out on the next request.
export const setToken = (token: string, expiresIn: number, rememberMe: boolean = false): void => {
	const storage = rememberMe ? localStorage : sessionStorage;
	clearTokensRaw();
	localStorage.setItem(TOKEN_KEYS.REMEMBER_ME, String(rememberMe));
	storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
	storage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, String(Math.floor(Date.now() / 1000) + expiresIn));
	dispatchTokenChange();
};

export const clearTokens = (): void => {
	clearTokensRaw();
	dispatchTokenChange();
};

// ─── Checks ──────────────────────────────────────────────────

export const isTokenExpired = (): boolean => {
	const expiry = getTokenExpiry();
	if (!expiry) return true;
	return Date.now() / 1000 > expiry - 30; // 30-second buffer
};

export const hasValidToken = (): boolean => !!getAccessToken() && !isTokenExpired();
