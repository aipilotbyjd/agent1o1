import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentVersionService } from './agent-versions.service';
import { agentVersionKeys, agentKeys } from './agents.keys';

export const useAgentVersions = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentVersionKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentVersionService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAgentVersion = (ws: string, agentId: string, version: number) =>
	useQuery({
		queryKey: agentVersionKeys.detail(ws, agentId, version),
		queryFn: ({ signal }) => AgentVersionService.detail(ws, agentId, version, signal),
		enabled: !!ws && !!agentId && !!version,
	});

export const useRestoreAgentVersion = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (version: number) => AgentVersionService.restore(ws, agentId, version),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: agentVersionKeys.list(ws, agentId) });
			qc.invalidateQueries({ queryKey: agentKeys.detail(ws, agentId) });
		},
		meta: { errorMessage: 'Failed to restore version' },
	});
};
