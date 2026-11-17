import * as Sentry from '@sentry/react';
import { ApiError } from '@/api/core/errors';

const dsn = import.meta.env.VITE_SENTRY_DSN;

/** Error tracking only runs when a DSN is configured, so local and CI builds stay silent. */
export const isSentryEnabled = Boolean(dsn);

let isInitialized = false;

/**
 * Starts error tracking once, before React renders. The Sentry SDK is pointed
 * at GlitchTip (Sentry-compatible); moving to another instance only needs a
 * new `VITE_SENTRY_DSN`.
 *
 * - No tracing, replay or profiling: GlitchTip does not use them and PostHog
 *   already records sessions.
 * - `ignoreErrors` drops what is not a bug in the app: a tab on an old build
 *   asking for chunks that are gone (RouteError reloads it), browser noise,
 *   and requests the app cancelled itself.
 * - `dataCollection` turns off cookies, headers, request bodies and query
 *   strings (sign-in and verification links carry tokens there).
 * - API failures are dropped: the server reports its own errors, and a refusal
 *   (validation, permission, sign-in) is an expected answer.
 */
export const initSentry = (): void => {
	if (!isSentryEnabled || isInitialized) return;

	Sentry.init({
		dsn,
		environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
		release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
		dataCollection: {
			userInfo: false,
			cookies: false,
			httpHeaders: false,
			httpBodies: [],
			urlQueryParams: false,
		},
		ignoreErrors: [
			/Failed to fetch dynamically imported module/i,
			/Importing a module script failed/i,
			/error loading dynamically imported module/i,
			/ResizeObserver loop/i,
			'CanceledError',
			'AbortError',
		],
		denyUrls: [
			/^chrome-extension:\/\//i,
			/^moz-extension:\/\//i,
			/^safari-(web-)?extension:\/\//i,
		],
		beforeSend: (event, hint) => (ApiError.is(hint.originalException) ? null : event),
	});

	isInitialized = true;
};

/** Reports an error the app caught itself. Does nothing when tracking is off. */
export const reportError = (error: unknown): void => {
	if (!isSentryEnabled) return;
	Sentry.captureException(error);
};

export { Sentry };
