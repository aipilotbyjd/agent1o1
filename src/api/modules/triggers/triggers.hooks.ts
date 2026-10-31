import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateTriggerDto,
	TTriggerEventStatus,
	TTriggerListFilter,
	TUpdateTriggerDto,
} from '@/types/trigger.type';
import { TriggerService } from './triggers.service';
import { triggerKeys, triggerEventKeys } from './triggers.keys';

// No `show` route on the backend: a trigger is only ever listed, created,
// updated, deleted, run, or token-rotated, so this skips createResource()
// and useDetail.

/** Every mutation below invalidates `triggerKeys.lists(ws)`, which prefixes each filtered list too. */
export const useTriggers = (
	ws: string,
	filter?: TTriggerListFilter,
	options?: { refetchInterval?: number },
) =>
	useQuery({
		queryKey: triggerKeys.list(ws, filter),
		queryFn: ({ signal }) => TriggerService.list(ws, filter, signal),
		enabled: !!ws && (!filter || !!filter.target_id),
		refetchInterval: options?.refetchInterval,
	});

export const useCreateTrigger = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateTriggerDto) => TriggerService.create(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: triggerKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create trigger' },
	});
};

export const useUpdateTrigger = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateTriggerDto }) =>
			TriggerService.update(ws, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: triggerKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to update trigger' },
	});
};

export const useDeleteTrigger = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TriggerService.remove(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: triggerKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete trigger' },
	});
};

export const useRunTrigger = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TriggerService.run(ws, id),
		onSuccess: (_event, id) => {
			qc.invalidateQueries({ queryKey: triggerEventKeys.list(ws, id) });
			qc.invalidateQueries({ queryKey: triggerKeys.lists(ws) });
		},
		meta: { errorMessage: 'Failed to run trigger' },
	});
};

export const useRotateTriggerToken = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TriggerService.rotateToken(ws, id),
		// The list is the only source of `token`, so it must refetch for the new URL to show.
		onSuccess: () => qc.invalidateQueries({ queryKey: triggerKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to rotate trigger token' },
	});
};

/** Refreshes every 10s while shown, so new deliveries appear without a reload. */
export const useTriggerEvents = (ws: string, id: string) =>
	useQuery({
		queryKey: triggerEventKeys.list(ws, id),
		queryFn: ({ signal }) =>
			TriggerService.events(ws, id, undefined, signal).then((page) => page.events),
		enabled: !!ws && !!id,
		refetchInterval: 10_000,
	});

const EVENTS_PER_PAGE = 20;

/**
 * A trigger's full event history, a page at a time, optionally narrowed to
 * some statuses. Refreshes every 10s like `useTriggerEvents`. Sits under the
 * same key prefix, so running the trigger refreshes it too.
 */
export const useTriggerEventFeed = (ws: string, id: string, status?: TTriggerEventStatus[]) =>
	useInfiniteQuery({
		queryKey: triggerEventKeys.feed(ws, id, status),
		queryFn: ({ pageParam, signal }) =>
			TriggerService.events(
				ws,
				id,
				{ page: pageParam, per_page: EVENTS_PER_PAGE, status },
				signal,
			),
		initialPageParam: 1,
		getNextPageParam: (page) =>
			page.meta.current_page < page.meta.last_page ? page.meta.current_page + 1 : undefined,
		enabled: !!ws && !!id,
		refetchInterval: 10_000,
	});

/**
 * Reads what the trigger sees right now, so fields can be mapped from real
 * data. A mutation, not a query: it calls the connected app, so it only runs
 * when asked, never on its own.
 */
export const useTriggerSample = (ws: string) =>
	useMutation({
		mutationFn: (id: string) => TriggerService.sample(ws, id),
		meta: { errorMessage: 'Could not read a sample' },
	});

/** Runs a past event again as a new event, then refreshes the event lists. */
export const useReplayTriggerEvent = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, eventId }: { id: string; eventId: string }) =>
			TriggerService.replay(ws, id, eventId),
		onSuccess: (_event, { id }) => {
			qc.invalidateQueries({ queryKey: triggerEventKeys.list(ws, id) });
			qc.invalidateQueries({ queryKey: triggerKeys.lists(ws) });
		},
		meta: { errorMessage: 'Failed to replay event' },
	});
};
