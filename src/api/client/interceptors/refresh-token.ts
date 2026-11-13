import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, isRememberMe, setToken, clearTokens } from '@/api/core/token-manager';
import { withRefreshLock } from '@/api/core/refresh-lock';
import { authEvents } from '@/api/core/auth-events';

// ============================================================
// Refresh Token
// ------------------------------------------------------------
// On a 401, refreshes the token once and replays every request
// queued up behind it. The refresh token itself is never read from
// storage: it's an httpOnly cookie the browser attaches
// automatically (see `withCredentials` on the axios client) and the
// backend reads straight off the request. Requests parked in the
// queue get `_retry` set too before replay, without that, a
// still-rejected refreshed token sends every queued request
// straight back into this branch, amplifying against the refresh
// endpoint under a burst of parallel requests instead of failing
// cleanly.
//
// Tabs share one sign-in, and the backend rotates the refresh token on
// every use, so two tabs refreshing at once would have the second one
// rejected and sign everybody out. The refresh runs inside a
// browser-wide lock, and a tab that gets the lock after another tab
// already refreshed reuses the new token instead of refreshing again.
// ============================================================

type TRetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type TQueuedRequest = {
	resolve: (token: string) => void;
	reject: (error: Error) => void;
};

let isRefreshing = false;
let failedQueue: TQueuedRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
	failedQueue.forEach((promise) => {
		if (error) promise.reject(error);
		else if (token) promise.resolve(token);
	});
	failedQueue = [];
};

const bearerTokenOf = (config: InternalAxiosRequestConfig): string | null => {
	const header = config.headers?.Authorization;
	return typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
};

const expireSession = () => {
	clearTokens();
	authEvents.emit('session-expired');
};

const replayWithToken = (client: AxiosInstance, request: TRetryableConfig, token: string) => {
	request._retry = true;
	if (request.headers) {
		request.headers.Authorization = `Bearer ${token}`;
	}
	return client(request);
};

/**
 * Returns a fresh access token, refreshing only if no one else has. `sentToken` is the token
 * the rejected request carried: a different token already in storage means another tab (or
 * request) refreshed while this one waited for the lock.
 */
const refreshAccessToken = (client: AxiosInstance, sentToken: string | null): Promise<string> =>
	withRefreshLock(async () => {
		const latestToken = getAccessToken();
		if (latestToken && latestToken !== sentToken) return latestToken;

		const response = await client.post('/auth/refresh');
		const { access_token, expires_in } = response.data.data.tokens;

		setToken(access_token, expires_in, isRememberMe());
		return access_token as string;
	});

export const refreshOn401 = (client: AxiosInstance) => {
	client.interceptors.response.use(
		(response) => response,
		async (error: AxiosError) => {
			const originalRequest = error.config as TRetryableConfig;

			if (originalRequest?.url?.includes('/auth/refresh')) {
				return Promise.reject(error);
			}

			if (error.response?.status !== 401 || originalRequest._retry) {
				return Promise.reject(error);
			}

			if (!getAccessToken()) {
				expireSession();
				return Promise.reject(error);
			}

			if (isRefreshing) {
				return new Promise<string>((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then((token) => replayWithToken(client, originalRequest, token));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const accessToken = await refreshAccessToken(
					client,
					bearerTokenOf(originalRequest),
				);

				processQueue(null, accessToken);
				return replayWithToken(client, originalRequest, accessToken);
			} catch (refreshError) {
				processQueue(refreshError as Error, null);
				expireSession();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		},
	);
};
