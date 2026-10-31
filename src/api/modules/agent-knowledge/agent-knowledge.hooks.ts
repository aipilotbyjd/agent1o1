import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TAgentKnowledgeMode, TAgentKnowledge } from '@/types/agent.type';
import { AgentKnowledgeService } from './agent-knowledge.service';
import { agentKnowledgeKeys } from './agent-knowledge.keys';

export const useAgentKnowledge = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentKnowledgeKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentKnowledgeService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

/** Attaching and changing a mode answer with the full list, so it's written
 *  straight into the cache instead of being fetched again. */
const useSourcesMutation = <TArgs>(
	ws: string,
	agentId: string,
	fn: (args: TArgs) => Promise<TAgentKnowledge>,
	errorMessage: string,
) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: fn,
		onSuccess: (sources) => qc.setQueryData(agentKnowledgeKeys.list(ws, agentId), sources),
		meta: { errorMessage },
	});
};

export const useAttachAgentKnowledge = (ws: string, agentId: string) =>
	useSourcesMutation(
		ws,
		agentId,
		({ collection, mode }: { collection: string; mode?: TAgentKnowledgeMode }) =>
			AgentKnowledgeService.attach(ws, agentId, collection, mode),
		'Failed to attach knowledge',
	);

export const useUpdateAgentKnowledgeMode = (ws: string, agentId: string) =>
	useSourcesMutation(
		ws,
		agentId,
		({ collection, mode }: { collection: string; mode: TAgentKnowledgeMode }) =>
			AgentKnowledgeService.update(ws, agentId, collection, mode),
		'Failed to change how this knowledge is used',
	);

export const useDetachAgentKnowledge = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (collection: string) => AgentKnowledgeService.detach(ws, agentId, collection),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentKnowledgeKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to detach knowledge' },
	});
};
