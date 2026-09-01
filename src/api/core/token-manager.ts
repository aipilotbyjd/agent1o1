let accessToken: string | null = null;
let accessTokenExpiry: number | null = null;

export const TOKEN_CHANGE_EVENT = 'a1o1_token_change';
const LOGOUT_MARKER_KEY = 'a1o1_logged_out';

const dispatchTokenChange = () => {
	window.dispatchEvent(new CustomEvent(TOKEN_CHANGE_EVENT));
};

export const getAccessToken = (): string | null => accessToken;

export const getTokenExpiry = (): number | null => accessTokenExpiry;

export const setToken = (token: string, expiresIn: number): void => {
	accessToken = token;
	accessTokenExpiry = Math.floor(Date.now() / 1000) + expiresIn;
	localStorage.removeItem(LOGOUT_MARKER_KEY);
	dispatchTokenChange();
};

export const clearTokens = (): void => {
	accessToken = null;
	accessTokenExpiry = null;
	localStorage.setItem(LOGOUT_MARKER_KEY, String(Date.now()));
	dispatchTokenChange();
};

export const onCrossTabLogout = (callback: () => void): (() => void) => {
	const handler = (e: StorageEvent) => {
		if (e.key === LOGOUT_MARKER_KEY && e.newValue) callback();
	};
	window.addEventListener('storage', handler);
	return () => window.removeEventListener('storage', handler);
};

export const isTokenExpired = (): boolean => {
	if (!accessTokenExpiry) return true;
	return Date.now() / 1000 > accessTokenExpiry - 30;
};

export const hasValidToken = (): boolean => !!accessToken && !isTokenExpired();

const TokenManager = {
	setToken,
	getToken: getAccessToken,
	removeToken: clearTokens,
};

export default TokenManager;
