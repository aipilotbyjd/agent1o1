import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TUpdateReflectionSettingsDto } from '@/types/agent.type';
import {
	AgentReflectionSettingsService,
	AgentReflectionRunService,
	AgentReflectionService,
} from './agent-reflections.service';
import { agentReflectionKeys } from './agents.keys';

export const useAgentReflectionSettings = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentReflectionKeys.settings(ws, agentId),
		queryFn: ({ signal }) => AgentReflectionSettingsService.show(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useUpdateAgentReflectionSettings = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateReflectionSettingsDto) =>
			AgentReflectionSettingsService.update(ws, agentId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentReflectionKeys.settings(ws, agentId) }),
		meta: { errorMessage: 'Failed to update reflection settings' },
	});
};

export const useAgentReflectionRuns = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentReflectionKeys.runs(ws, agentId),
		queryFn: ({ signal }) => AgentReflectionRunService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAgentReflectionRun = (ws: string, agentId: string, runId: string) =>
	useQuery({
		queryKey: agentReflectionKeys.run(ws, agentId, runId),
		queryFn: ({ signal }) => AgentReflectionRunService.detail(ws, agentId, runId, signal),
		enabled: !!ws && !!agentId && !!runId,
	});

export const useCreateAgentReflectionRun = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => AgentReflectionRunService.create(ws, agentId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentReflectionKeys.runs(ws, agentId) }),
		meta: { errorMessage: 'Failed to start reflection run' },
	});
};

export const useAgentReflections = (ws: string, agentId: string, params?: { status?: string }) =>
	useQuery({
		queryKey: [...agentReflectionKeys.list(ws, agentId), params ?? {}],
		queryFn: ({ signal }) => AgentReflectionService.list(ws, agentId, params, signal),
		enabled: !!ws && !!agentId,
	});

export const useApplyAgentReflection = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentReflectionService.apply(ws, agentId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentReflectionKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to apply reflection' },
	});
};

export const useDismissAgentReflection = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentReflectionService.dismiss(ws, agentId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentReflectionKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to dismiss reflection' },
	});
};
