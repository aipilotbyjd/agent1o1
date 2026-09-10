import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TAgentEvaluationSettings,
	TUpdateAgentEvaluationSettingsDto,
	TAgentSessionEvaluation,
} from '@/types/agent.type';
import { AgentEvaluationEndpoints as E } from './agents.endpoints';

export const AgentEvaluationSettingsService = {
	show: (ws: string, agentId: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ settings: TAgentEvaluationSettings }>>(E.settings(ws, agentId), { signal })
			.then(unwrapKey<TAgentEvaluationSettings>('settings')),

	update: (ws: string, agentId: string, payload: TUpdateAgentEvaluationSettingsDto) =>
		axiosClient
			.patch<TApiResponse<{ settings: TAgentEvaluationSettings }>>(
				E.updateSettings(ws, agentId),
				payload,
			)
			.then(unwrapKey<TAgentEvaluationSettings>('settings')),
};

export const AgentSessionEvaluationService = {
	list: (
		ws: string,
		agentId: string,
		params?: { grade?: string; per_page?: number },
		signal?: AbortSignal,
	) =>
		axiosClient
			.get<TApiResponse<TAgentSessionEvaluation[]> & { meta: TPaginationMeta }>(
				E.sessionEvaluations(ws, agentId),
				{ params, signal },
			)
			.then((r) => ({ evaluations: r.data.data, meta: r.data.meta })),

	detail: (ws: string, agentId: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ evaluation: TAgentSessionEvaluation }>>(
				E.sessionEvaluation(ws, agentId, id),
				{ signal },
			)
			.then(unwrapKey<TAgentSessionEvaluation>('evaluation')),

	/** Manually (re-)evaluates one session, bypassing the automatic debounce. */
	runOnSession: (ws: string, agentId: string, sessionId: string) =>
		axiosClient
			.post<TApiResponse<{ evaluation: TAgentSessionEvaluation }>>(
				E.runOnSession(ws, agentId, sessionId),
			)
			.then(unwrapKey<TAgentSessionEvaluation>('evaluation')),
};
