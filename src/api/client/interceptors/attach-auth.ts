import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '@/api/core/token-manager';

const PUBLIC_ENDPOINTS = [
	'/auth/login',
	'/auth/register',
	'/auth/forgot-password',
	'/auth/reset-password',
	'/auth/refresh',
];

const isPublic = (url?: string) =>
	!!url && PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));

export const attachAuth = (client: AxiosInstance) => {
	client.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			if (!isPublic(config.url)) {
				const token = getAccessToken();
				if (token && config.headers) {
					config.headers.Authorization = `Bearer ${token}`;
				}
			}
			return config;
		},
		(error) => Promise.reject(error),
	);
};
