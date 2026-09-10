import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type {
	TAgentKnowledge,
	TCreateAgentKnowledgeDto,
	TUpdateAgentKnowledgeDto,
	TAgentKnowledgeSources,
} from '@/types/agent.type';
import { AgentKnowledgeEndpoints as K, AgentKnowledgeSourceEndpoints as S } from './agents.endpoints';

export const AgentKnowledgeService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ knowledge: TAgentKnowledge[] }>>(K.list(ws, agentId), { signal })
			.then(unwrapKey<TAgentKnowledge[]>('knowledge')),

	create: (ws: string, agentId: string, payload: TCreateAgentKnowledgeDto) =>
		axiosClient
			.post<TApiResponse<{ knowledge: TAgentKnowledge }>>(K.create(ws, agentId), payload)
			.then(unwrapKey<TAgentKnowledge>('knowledge')),

	update: (ws: string, agentId: string, id: string, payload: TUpdateAgentKnowledgeDto) =>
		axiosClient
			.patch<TApiResponse<{ knowledge: TAgentKnowledge }>>(K.update(ws, agentId, id), payload)
			.then(unwrapKey<TAgentKnowledge>('knowledge')),

	remove: (ws: string, agentId: string, id: string) =>
		axiosClient.delete(K.delete(ws, agentId, id)).then(() => undefined),
};

export const AgentKnowledgeSourceService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAgentKnowledgeSources>>(S.list(ws, agentId), { signal })
			.then((r) => r.data.data),

	attach: (ws: string, agentId: string, collection: string) =>
		axiosClient
			.post<TApiResponse<{ attached: string[] }>>(S.attach(ws, agentId, collection))
			.then(unwrapKey<string[]>('attached')),

	detach: (ws: string, agentId: string, collection: string) =>
		axiosClient.delete(S.detach(ws, agentId, collection)).then(() => undefined),
};
