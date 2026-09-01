import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setToken, clearTokens } from '@/api/core/token-manager';

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

const redirectToLogin = () => {
	if (!window.location.pathname.includes('/login')) {
		window.location.href = '/login';
	}
};

export const refreshOn401 = (client: AxiosInstance) => {
	client.interceptors.response.use(
		(response) => response,
		async (error: AxiosError) => {
			const originalRequest = error.config as InternalAxiosRequestConfig & {
				_retry?: boolean;
			};

			if (originalRequest?.url?.includes('/auth/refresh')) {
				return Promise.reject(error);
			}

			if (error.response?.status !== 401 || originalRequest._retry) {
				return Promise.reject(error);
			}

			if (!getAccessToken()) {
				clearTokens();
				redirectToLogin();
				return Promise.reject(error);
			}

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						if (originalRequest.headers) {
							originalRequest.headers.Authorization = `Bearer ${token}`;
						}
						return client(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const response = await client.post('/auth/refresh');
				const { access_token, expires_in } = response.data.data.tokens;

				setToken(access_token, expires_in);
				processQueue(null, access_token);

				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${access_token}`;
				}
				return client(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError as Error, null);
				clearTokens();
				redirectToLogin();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		},
	);
};
