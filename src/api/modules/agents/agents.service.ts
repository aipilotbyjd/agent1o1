import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TListParams } from '@/api/core';
import type { TAgent, TCreateAgentDto, TUpdateAgentDto, TSyncAgentTagsDto } from '@/types/agent.type';
import { AgentEndpoints as E } from './agents.endpoints';

export const AgentService = {
	list: (ws: string, _params?: TListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ agents: TAgent[] }>>(E.list(ws), { signal })
			.then(unwrapKey<TAgent[]>('agents')),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ agent: TAgent }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TAgent>('agent')),

	create: (ws: string, payload: TCreateAgentDto) =>
		axiosClient
			.post<TApiResponse<{ agent: TAgent }>>(E.create(ws), payload)
			.then(unwrapKey<TAgent>('agent')),

	update: (ws: string, id: string, payload: TUpdateAgentDto) =>
		axiosClient
			.patch<TApiResponse<{ agent: TAgent }>>(E.update(ws, id), payload)
			.then(unwrapKey<TAgent>('agent')),

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	duplicate: (ws: string, id: string) =>
		axiosClient
			.post<TApiResponse<{ agent: TAgent }>>(E.duplicate(ws, id))
			.then(unwrapKey<TAgent>('agent')),

	syncTags: (ws: string, id: string, payload: TSyncAgentTagsDto) =>
		axiosClient
			.put<TApiResponse<{ agent: TAgent }>>(E.syncTags(ws, id), payload)
			.then(unwrapKey<TAgent>('agent')),
};
