import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, isRememberMe, setToken, clearTokens } from '@/api/core/token-manager';
import { authEvents } from '@/api/core/auth-events';

// ============================================================
// Refresh Token
// ------------------------------------------------------------
// On a 401, refreshes the token once and replays every request
// queued up behind it. The refresh token itself is never read from
// storage — it's an httpOnly cookie the browser attaches
// automatically (see `withCredentials` on the axios client) and the
// backend reads straight off the request. Requests parked in the
// queue get `_retry` set too before replay — without that, a
// still-rejected refreshed token sends every queued request
// straight back into this branch, amplifying against the refresh
// endpoint under a burst of parallel requests instead of failing
// cleanly.
// ============================================================

type TRetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
	failedQueue.forEach((promise) => {
		if (error) promise.reject(error);
		else if (token) promise.resolve(token);
	});
	failedQueue = [];
};

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

			const currentToken = getAccessToken();
			if (!currentToken) {
				clearTokens();
				authEvents.emit('session-expired');
				return Promise.reject(error);
			}

			if (isRefreshing) {
				return new Promise<string>((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then((token) => {
					originalRequest._retry = true;
					if (originalRequest.headers) {
						originalRequest.headers.Authorization = `Bearer ${token}`;
					}
					return client(originalRequest);
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const response = await client.post('/auth/refresh');
				const { access_token, expires_in } = response.data.data.tokens;

				setToken(access_token, expires_in, isRememberMe());
				processQueue(null, access_token);

				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${access_token}`;
				}
				return client(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError as Error, null);
				clearTokens();
				authEvents.emit('session-expired');
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		},
	);
};
