import type { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '@/api/core/errors';

// ============================================================
// Normalize Error
// ------------------------------------------------------------
// Pure AxiosError → ApiError mapper. No toasts here — display is
// owned exclusively by the query client, so a failure never shows
// two toasts for one cause.
// ============================================================

type TErrorBody = {
	message?: string;
	errors?: Record<string, string[]>;
};

export const normalizeError = (client: AxiosInstance) => {
	client.interceptors.response.use(
		(response) => response,
		(error: AxiosError<TErrorBody>) => {
			const status = error.response?.status;
			const message =
				error.response?.data?.message || error.message || 'Something went wrong';
			const fields = error.response?.data?.errors;

			return Promise.reject(new ApiError(status, message, fields));
		},
	);
};
