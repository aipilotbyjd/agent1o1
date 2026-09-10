import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateAgentKnowledgeDto, TUpdateAgentKnowledgeDto } from '@/types/agent.type';
import { AgentKnowledgeService, AgentKnowledgeSourceService } from './agent-knowledge.service';
import { agentKnowledgeKeys, agentKnowledgeSourceKeys } from './agents.keys';

export const useAgentKnowledge = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentKnowledgeKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentKnowledgeService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useCreateAgentKnowledge = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateAgentKnowledgeDto) => AgentKnowledgeService.create(ws, agentId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKnowledgeKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to add knowledge entry' },
	});
};

export const useUpdateAgentKnowledge = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateAgentKnowledgeDto }) =>
			AgentKnowledgeService.update(ws, agentId, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKnowledgeKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to update knowledge entry' },
	});
};

export const useDeleteAgentKnowledge = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentKnowledgeService.remove(ws, agentId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKnowledgeKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to delete knowledge entry' },
	});
};

export const useAgentKnowledgeSources = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentKnowledgeSourceKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentKnowledgeSourceService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAttachAgentKnowledgeSource = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (collection: string) => AgentKnowledgeSourceService.attach(ws, agentId, collection),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKnowledgeSourceKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to attach knowledge source' },
	});
};

export const useDetachAgentKnowledgeSource = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (collection: string) => AgentKnowledgeSourceService.detach(ws, agentId, collection),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKnowledgeSourceKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to detach knowledge source' },
	});
};
