import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TListParams } from '@/api/core';
import type {
	TTrigger,
	TTriggerEvent,
	TTriggerSampleItem,
	TCreateTriggerDto,
	TUpdateTriggerDto,
	TTriggerEventPage,
	TTriggerEventParams,
} from '@/types/trigger.type';
import type { TPaginationMeta } from '@/types/api.type';
import { TriggerEndpoints as E } from './triggers.endpoints';

export const TriggerService = {
	// `target_type` + `target_id` narrow the list to one workflow's or
	// agent's triggers; without them it's the whole workspace.
	list: (ws: string, params?: TListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ triggers: TTrigger[] }>>(E.list(ws), { params, signal })
			.then(unwrapKey<TTrigger[]>('triggers')),

	create: (ws: string, payload: TCreateTriggerDto) =>
		axiosClient
			.post<TApiResponse<{ trigger: TTrigger }>>(E.create(ws), payload)
			.then(unwrapKey<TTrigger>('trigger')),

	update: (ws: string, id: string, payload: TUpdateTriggerDto) =>
		axiosClient
			.patch<TApiResponse<{ trigger: TTrigger }>>(E.update(ws, id), payload)
			.then(unwrapKey<TTrigger>('trigger')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	run: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ event: TTriggerEvent }>>(E.run(ws, id))
			.then(unwrapKey<TTriggerEvent>('event')),

	rotateToken: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ trigger: TTrigger }>>(E.rotateToken(ws, id))
			.then(unwrapKey<TTrigger>('trigger')),

	events: (ws: string, id: string, params?: TTriggerEventParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TTriggerEvent[]> & { meta: TPaginationMeta }>(E.events(ws, id), {
				params,
				signal,
			})
			.then((r): TTriggerEventPage => ({ events: r.data.data, meta: r.data.meta })),

	// What the trigger sees right now, without running anything.
	sample: (ws: string, id: string) =>
		axiosClient
			.get<TApiResponse<{ items: TTriggerSampleItem[] }>>(E.sample(ws, id))
			.then(unwrapKey<TTriggerSampleItem[]>('items')),

	// Runs a past event's payload again as a new event.
	replay: (ws: string, id: string, eventId: string) =>
		axiosClient
			.post<TApiResponse<{ event: TTriggerEvent }>>(E.replay(ws, id, eventId))
			.then(unwrapKey<TTriggerEvent>('event')),
};
