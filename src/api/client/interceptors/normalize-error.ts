import type { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '@/api/core/errors';
import type { TApiIssue } from '@/api/core/errors';

// ============================================================
// Normalize Error
// ------------------------------------------------------------
// Pure AxiosError → ApiError mapper. No toasts here — display is
// owned exclusively by the query client, so a failure never shows
// two toasts for one cause.
// ============================================================

type TErrorBody = {
	message?: string;
	errors?: Record<string, string[]> | string[];
	/** Workflow validation: each problem with its step, field and a user-facing message. */
	issues?: TApiIssue[];
};

const MAX_LISTED_ERRORS = 3;

// Graph validation answers with a list of reasons instead of a field map. When
// it also sends `issues`, the message already summarises them in plain words
// and screens list the issues themselves by step, so nothing is appended.
const withListedErrors = (message: string, errors: string[]) => {
	if (errors.length === 0) return message;
	const listed = errors.slice(0, MAX_LISTED_ERRORS).join(' ');
	const more = errors.length - MAX_LISTED_ERRORS;
	return `${message} ${listed}${more > 0 ? ` (+${more} more)` : ''}`;
};

export const normalizeError = (client: AxiosInstance) => {
	client.interceptors.response.use(
		(response) => response,
		(error: AxiosError<TErrorBody>) => {
			const status = error.response?.status;
			const message =
				error.response?.data?.message || error.message || 'Something went wrong';
			const errors = error.response?.data?.errors;
			const issues = error.response?.data?.issues ?? [];

			return Promise.reject(
				Array.isArray(errors)
					? new ApiError(
							status,
							issues.length > 0 ? message : withListedErrors(message, errors),
							undefined,
							issues,
						)
					: new ApiError(status, message, errors, issues),
			);
		},
	);
};
