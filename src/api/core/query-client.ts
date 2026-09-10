import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './errors';
import { notify } from './notify';

// ============================================================
// Query Client
// ------------------------------------------------------------
// QueryCache/MutationCache are the single owner of error-toast
// display. Call sites opt into a custom message via
// `meta.errorMessage`, or opt out entirely via `meta.silent` —
// never via a hook-level `onError`, which would show it twice.
// ============================================================

/** Never retry a refusal (4xx) — only retry transient failures (5xx / network / 429). */
const shouldRetry = (failureCount: number, error: unknown) => {
	if (ApiError.is(error) && error.status && error.status < 500 && error.status !== 429) {
		return false;
	}
	return failureCount < 2;
};

export const createQueryClient = () =>
	new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				if (query.meta?.silent) return;
				notify.error(ApiError.is(error) ? error.message : 'Could not load data');
			},
		}),
		mutationCache: new MutationCache({
			onError: (error, _vars, _ctx, mutation) => {
				if (mutation.meta?.silent) return;
				const fallback = (mutation.meta?.errorMessage as string) ?? 'Something went wrong';
				notify.error(ApiError.is(error) ? error.message : fallback);
			},
		}),
		defaultOptions: {
			queries: {
				staleTime: 5 * 60_000,
				gcTime: 10 * 60_000,
				retry: shouldRetry,
				refetchOnWindowFocus: false,
			},
			mutations: {
				retry: 0,
			},
		},
	});
