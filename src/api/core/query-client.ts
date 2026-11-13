import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './errors';
import { notify } from './notify';
import { announcementKeys } from '@/api/modules/announcements/announcements.keys';
import type { TAnnouncementsPayload } from '@/types/announcement.type';

// ============================================================
// Query Client
// ------------------------------------------------------------
// QueryCache/MutationCache are the single owner of error-toast
// display. Call sites opt into a custom message via
// `meta.errorMessage`, or opt out entirely via `meta.silent` (or
// for some statuses only, via `meta.silentStatuses`, when the call
// site handles those itself), never via a hook-level `onError`,
// which would show it twice.
// ============================================================

/** Never retry a refusal (4xx), only retry transient failures (5xx / network / 429). */
const shouldRetry = (failureCount: number, error: unknown) => {
	if (ApiError.is(error) && error.status && error.status < 500 && error.status !== 429) {
		return false;
	}
	if (ApiError.is(error) && error.isMaintenance) {
		return false;
	}
	return failureCount < 2;
};

const MAINTENANCE_TOAST_GAP_MS = 15_000;
const MAINTENANCE_MESSAGE =
	'The app is read-only for maintenance right now, so changes are paused. Try again shortly.';

export const createQueryClient = () => {
	let lastMaintenanceToast = 0;

	/**
	 * A maintenance refusal is expected, not a failure: say so once, calmly, and
	 * refresh the notices so the screen locks to match the server.
	 */
	const handleMaintenance = (error: unknown): boolean => {
		if (!ApiError.is(error) || !error.isMaintenance) return false;
		client.invalidateQueries({ queryKey: announcementKeys.all });
		if (Date.now() - lastMaintenanceToast > MAINTENANCE_TOAST_GAP_MS) {
			lastMaintenanceToast = Date.now();
			// The operator's own wording wins; the server's text carries a raw timestamp.
			const notices = client.getQueryData<TAnnouncementsPayload>(announcementKeys.list());
			const custom = notices?.announcements.find(
				(a) => a.blocks_writes && a.window_open && a.read_only_message,
			)?.read_only_message;
			notify.warn(custom ?? MAINTENANCE_MESSAGE);
		}
		return true;
	};

	const client = new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				if (query.meta?.silent) return;
				if (handleMaintenance(error)) return;
				notify.error(ApiError.is(error) ? error.message : 'Could not load data');
			},
		}),
		mutationCache: new MutationCache({
			onError: (error, _vars, _ctx, mutation) => {
				if (mutation.meta?.silent) return;
				if (handleMaintenance(error)) return;
				const silentStatuses = mutation.meta?.silentStatuses as number[] | undefined;
				if (ApiError.is(error) && error.status && silentStatuses?.includes(error.status))
					return;
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

	return client;
};
