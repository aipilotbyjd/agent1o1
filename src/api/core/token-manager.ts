// ============================================================
// Token Manager
// ------------------------------------------------------------
// Keeps the access token and its expiry in localStorage, so every
// tab of the browser shares one sign-in and a sign-in or sign-out
// in one tab reaches the others (the `storage` event).
//
// "Remember me" decides how long the sign-in lasts, not which tabs
// can see it: without it, the sign-in ends when the browser quits
// (see `browser-session.ts`).
//
// The refresh token itself is never stored here: the backend issues
// it as an httpOnly cookie and reads it back the same way, so the
// client never sees it.
// ============================================================

import safeStorage from '@/utils/safeStorage.util';
import { browserSession } from './browser-session';

const TOKEN_KEYS = {
	ACCESS_TOKEN: 'a1o1_access_token',
	TOKEN_EXPIRY: 'a1o1_token_expiry',
	REMEMBER_ME: 'a1o1_remember_me',
} as const;

export const TOKEN_CHANGE_EVENT = 'a1o1_token_change';

const dispatchTokenChange = () => {
	window.dispatchEvent(new CustomEvent(TOKEN_CHANGE_EVENT));
};

const removeStoredTokens = (): void => {
	Object.values(TOKEN_KEYS).forEach((key) => {
		safeStorage.remove(key);
		// Older builds kept the token per tab in sessionStorage.
		safeStorage.remove(key, 'session');
	});
};

// ─── Getters ─────────────────────────────────────────────────

export const isRememberMe = (): boolean => safeStorage.get(TOKEN_KEYS.REMEMBER_ME) === 'true';

export const getAccessToken = (): string | null => {
	const token = safeStorage.get(TOKEN_KEYS.ACCESS_TOKEN);
	if (!token) return null;

	if (!isRememberMe() && !browserSession.isActive()) {
		removeStoredTokens();
		return null;
	}

	return token;
};

export const getTokenExpiry = (): number | null => {
	const expiry = safeStorage.get(TOKEN_KEYS.TOKEN_EXPIRY);
	return expiry ? parseInt(expiry, 10) : null;
};

// ─── Setters ─────────────────────────────────────────────────

// Deliberately not safeStorage: a token that cannot be stored must fail the login loudly,
// not leave the user silently signed out on the next request.
export const setToken = (token: string, expiresIn: number, rememberMe: boolean = false): void => {
	localStorage.setItem(TOKEN_KEYS.REMEMBER_ME, String(rememberMe));
	localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
	localStorage.setItem(
		TOKEN_KEYS.TOKEN_EXPIRY,
		String(Math.floor(Date.now() / 1000) + expiresIn),
	);

	Object.values(TOKEN_KEYS).forEach((key) => safeStorage.remove(key, 'session'));

	if (rememberMe) browserSession.end();
	else browserSession.start();

	dispatchTokenChange();
};

export const clearTokens = (): void => {
	removeStoredTokens();
	browserSession.end();
	dispatchTokenChange();
};

// ─── Checks ──────────────────────────────────────────────────

export const isTokenExpired = (): boolean => {
	const expiry = getTokenExpiry();
	if (!expiry) return true;
	return Date.now() / 1000 > expiry - 30; // 30-second buffer
};
