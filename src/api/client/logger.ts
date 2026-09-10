import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiConfig } from '@/api/core/config';

// ============================================================
// Logger
// ------------------------------------------------------------
// Method/URL/status/duration always log when enabled; request and
// response bodies only in dev — never unconditionally, and never
// in production, where that would leak customer data to the console.
// ============================================================

const DEBUG_FLAG = 'a1o1_debug_api';

const isEnabled = () =>
	apiConfig.debug || (typeof localStorage !== 'undefined' && localStorage.getItem(DEBUG_FLAG) === '1');

const logBodies = () => apiConfig.debug;

const requestUrl = (config: InternalAxiosRequestConfig | AxiosResponse['config']) =>
	`${config.baseURL ?? ''}${config.url ?? ''}`;

export const logRequest = (config: InternalAxiosRequestConfig) => {
	if (!isEnabled()) return config;
	(config as InternalAxiosRequestConfig & { __start?: number }).__start = performance.now();
	return config;
};

export const logResponse = (response: AxiosResponse) => {
	if (!isEnabled()) return response;
	const start = (response.config as InternalAxiosRequestConfig & { __start?: number }).__start;
	const duration = start ? `${Math.round(performance.now() - start)}ms` : '';
	console.info(
		'[API]',
		response.config.method?.toUpperCase(),
		requestUrl(response.config),
		response.status,
		duration,
		logBodies() ? response.data : '',
	);
	return response;
};

export const logError = (error: AxiosError) => {
	if (!isEnabled()) return Promise.reject(error);
	console.warn(
		'[API]',
		error.config?.method?.toUpperCase(),
		error.config ? requestUrl(error.config) : '',
		error.response?.status ?? 'network error',
		logBodies() ? error.response?.data : '',
	);
	return Promise.reject(error);
};
