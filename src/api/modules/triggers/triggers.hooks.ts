import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateTriggerDto, TUpdateTriggerDto } from '@/types/trigger.type';
import { TriggerService } from './triggers.service';
import { triggerKeys, triggerEventKeys } from './triggers.keys';

// No `show` route on the backend — a trigger is only ever listed, created,
// updated, deleted, run, or token-rotated, so this skips createResource()
// and useDetail.

export const useTriggers = (ws: string) =>
	useQuery({
		queryKey: triggerKeys.lists(ws),
		queryFn: ({ signal }) => TriggerService.list(ws, undefined, signal),
		enabled: !!ws,
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

export const useRunTrigger = (ws: string) =>
	useMutation({
		mutationFn: (id: string) => TriggerService.run(ws, id),
		meta: { errorMessage: 'Failed to run trigger' },
	});

export const useRotateTriggerToken = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TriggerService.rotateToken(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: triggerKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to rotate trigger token' },
	});
};

export const useTriggerEvents = (ws: string, id: string) =>
	useQuery({
		queryKey: triggerEventKeys.list(ws, id),
		queryFn: ({ signal }) => TriggerService.events(ws, id, signal),
		enabled: !!ws && !!id,
	});
