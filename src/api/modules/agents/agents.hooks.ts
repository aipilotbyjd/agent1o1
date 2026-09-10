import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createResource } from '@/api/core';
import type { TSyncAgentTagsDto } from '@/types/agent.type';
import { AgentService } from './agents.service';
import { agentKeys } from './agents.keys';

const Agents = createResource({
	service: AgentService,
	keys: agentKeys,
	label: { singular: 'Agent', plural: 'Agents' },
});

export const useAgents = Agents.useList;
export const useAgent = Agents.useDetail;
export const useCreateAgent = Agents.useCreate;
export const useUpdateAgent = Agents.useUpdate;
export const useDeleteAgent = Agents.useDelete;

export const useDuplicateAgent = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentService.duplicate(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to duplicate agent' },
	});
};

export const useSyncAgentTags = (ws: string, id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TSyncAgentTagsDto) => AgentService.syncTags(ws, id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.detail(ws, id) }),
		meta: { errorMessage: 'Failed to update agent tags' },
	});
};
