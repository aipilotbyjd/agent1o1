import { axiosClient } from '@/api/client';
import type { TApiResponse } from '@/api/core';
import type { TAgentKnowledgeMode, TAgentKnowledge } from '@/types/agent.type';
import { AgentKnowledgeEndpoints as S } from './agent-knowledge.endpoints';

export const AgentKnowledgeService = {
	list: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAgentKnowledge>>(S.list(ws, agentId), { signal })
			.then((r) => r.data.data),

	attach: (ws: string, agentId: string, collection: string, mode?: TAgentKnowledgeMode) =>
		axiosClient
			.post<
				TApiResponse<TAgentKnowledge>
			>(S.attach(ws, agentId, collection), mode ? { mode } : {})
			.then((r) => r.data.data),

	update: (ws: string, agentId: string, collection: string, mode: TAgentKnowledgeMode) =>
		axiosClient
			.patch<TApiResponse<TAgentKnowledge>>(S.update(ws, agentId, collection), { mode })
			.then((r) => r.data.data),

	detach: (ws: string, agentId: string, collection: string) =>
		axiosClient.delete(S.detach(ws, agentId, collection)).then(() => undefined),
};
