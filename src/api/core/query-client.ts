import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './errors';
import { notify } from './notify';
import { upgradeEvents } from './upgrade-events';
import { reportError } from '@/utils/sentry.util';
import { announcementKeys } from '@/api/modules/announcements/announcements.keys';
import { workspaceKeys } from '@/api/modules/workspaces/workspaces.keys';
import type { TAnnouncementsPayload } from '@/types/announcement.type';
import { NO_PERMISSION_MESSAGE } from '@/constants/permission.constant';

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

const LARAVEL_FORBIDDEN_MESSAGE = 'This action is unauthorized.';

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

	/**
	 * A 403 usually means the viewer's role changed (or they were removed)
	 * since the workspace list loaded. Refetch it so the UI catches up; the
	 * error itself is still shown by the caller's normal path.
	 */
	const handleForbidden = (error: unknown) => {
		if (!ApiError.is(error) || !error.isForbidden) return;
		client.invalidateQueries({ queryKey: workspaceKeys.all() });
	};

	/**
	 * A plan limit or an empty credit balance is a reason to upgrade, not an
	 * error: the app shell offers the upgrade instead of a red toast.
	 */
	const handlePaymentRequired = (error: unknown): boolean => {
		if (!ApiError.is(error) || !error.isPaymentRequired) return false;
		upgradeEvents.emit({ message: error.message });
		return true;
	};

	/** Laravel's stock refusal text reads poorly in a toast; specific messages are kept. */
	const messageFor = (error: ApiError) =>
		error.isForbidden && error.message === LARAVEL_FORBIDDEN_MESSAGE
			? NO_PERMISSION_MESSAGE
			: error.message;

	/** Anything that is not an API answer is a bug in the app's own code: report it. */
	const reportIfUnexpected = (error: unknown) => {
		if (!ApiError.is(error)) reportError(error);
	};

	const client = new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				reportIfUnexpected(error);
				handleForbidden(error);
				if (query.meta?.silent) return;
				if (handleMaintenance(error)) return;
				notify.error(ApiError.is(error) ? messageFor(error) : 'Could not load data');
			},
		}),
		mutationCache: new MutationCache({
			onError: (error, _vars, _ctx, mutation) => {
				reportIfUnexpected(error);
				handleForbidden(error);
				if (mutation.meta?.silent) return;
				if (handleMaintenance(error)) return;
				if (handlePaymentRequired(error)) return;
				const silentStatuses = mutation.meta?.silentStatuses as number[] | undefined;
				if (ApiError.is(error) && error.status && silentStatuses?.includes(error.status))
					return;
				const fallback = (mutation.meta?.errorMessage as string) ?? 'Something went wrong';
				notify.error(ApiError.is(error) ? messageFor(error) : fallback);
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
