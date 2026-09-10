import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TUpdateAgentEvaluationSettingsDto } from '@/types/agent.type';
import { AgentEvaluationSettingsService, AgentSessionEvaluationService } from './agent-evaluations.service';
import { agentEvaluationKeys } from './agents.keys';

export const useAgentEvaluationSettings = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentEvaluationKeys.settings(ws, agentId),
		queryFn: ({ signal }) => AgentEvaluationSettingsService.show(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useUpdateAgentEvaluationSettings = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateAgentEvaluationSettingsDto) =>
			AgentEvaluationSettingsService.update(ws, agentId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentEvaluationKeys.settings(ws, agentId) }),
		meta: { errorMessage: 'Failed to update evaluation settings' },
	});
};

export const useAgentSessionEvaluations = (
	ws: string,
	agentId: string,
	params?: { grade?: string; per_page?: number },
) =>
	useQuery({
		queryKey: agentEvaluationKeys.sessionEvaluations(ws, agentId, params),
		queryFn: ({ signal }) => AgentSessionEvaluationService.list(ws, agentId, params, signal),
		enabled: !!ws && !!agentId,
	});

export const useAgentSessionEvaluation = (ws: string, agentId: string, id: string) =>
	useQuery({
		queryKey: agentEvaluationKeys.sessionEvaluation(ws, agentId, id),
		queryFn: ({ signal }) => AgentSessionEvaluationService.detail(ws, agentId, id, signal),
		enabled: !!ws && !!agentId && !!id,
	});

export const useRunAgentSessionEvaluation = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (sessionId: string) => AgentSessionEvaluationService.runOnSession(ws, agentId, sessionId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['agents', ws, agentId, 'session-evaluations'] }),
		meta: { errorMessage: 'Failed to evaluate session' },
	});
};
