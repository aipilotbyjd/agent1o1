import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateAgentMemoryDto, TUpdateAgentMemoryDto } from '@/types/agent.type';
import { AgentMemoryService } from './agent-memory.service';
import { agentMemoryKeys } from './agents.keys';

export const useAgentMemories = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentMemoryKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentMemoryService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useCreateAgentMemory = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateAgentMemoryDto) => AgentMemoryService.create(ws, agentId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentMemoryKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to create memory' },
	});
};

export const useUpdateAgentMemory = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateAgentMemoryDto }) =>
			AgentMemoryService.update(ws, agentId, id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentMemoryKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to update memory' },
	});
};

export const useDeleteAgentMemory = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentMemoryService.remove(ws, agentId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentMemoryKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to delete memory' },
	});
};
