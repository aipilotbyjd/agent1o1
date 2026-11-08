import { axiosClient } from '@/api/client';
import { unwrapKey, fetchAllPages, unwrapCursorPage } from '@/api/core';
import type { TApiResponse, TCursorPaginationMeta } from '@/api/core';
import type {
	TAgentMemory,
	TCreateAgentMemoryDto,
	TUpdateAgentMemoryDto,
} from '@/types/agent.type';
import { AgentMemoryEndpoints as E } from './agent-memory.endpoints';

export const AgentMemoryService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		fetchAllPages((page) =>
			axiosClient
				.get<
					TApiResponse<TAgentMemory[]> & { meta: TCursorPaginationMeta }
				>(E.list(ws, agentId), { params: page, signal })
				.then(unwrapCursorPage<TAgentMemory>),
		),

	create: (ws: string, agentId: string, payload: TCreateAgentMemoryDto) =>
		axiosClient
			.post<TApiResponse<{ memory: TAgentMemory }>>(E.create(ws, agentId), payload)
			.then(unwrapKey<TAgentMemory>('memory')),

	update: (ws: string, agentId: string, id: string, payload: TUpdateAgentMemoryDto) =>
		axiosClient
			.patch<TApiResponse<{ memory: TAgentMemory }>>(E.update(ws, agentId, id), payload)
			.then(unwrapKey<TAgentMemory>('memory')),

	remove: (ws: string, agentId: string, id: string) =>
		axiosClient.delete(E.delete(ws, agentId, id)).then(() => undefined),
};
