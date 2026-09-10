import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TListParams } from '@/api/core';
import type { TTrigger, TTriggerEvent, TCreateTriggerDto, TUpdateTriggerDto } from '@/types/trigger.type';
import { TriggerEndpoints as E } from './triggers.endpoints';

export const TriggerService = {
	// The backend takes no list filters — `params` is accepted only to
	// match `createResource()`'s service contract.
	list: (ws: string, _params?: TListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ triggers: TTrigger[] }>>(E.list(ws), { signal })
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

	// Backend paginates internally but returns the page as a flat array —
	// no `meta`/`links` reach the client from this endpoint.
	events: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TTriggerEvent[]>>(E.events(ws, id), { signal })
			.then((r) => r.data.data),
};
