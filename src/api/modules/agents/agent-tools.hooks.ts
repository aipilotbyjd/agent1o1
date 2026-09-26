import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateAgentToolBindingDto } from '@/types/agent.type';
import {
	AgentToolBindingService,
	AgentWorkflowToolService,
	AgentSkillAttachmentService,
	AgentSubagentService,
} from './agent-tools.service';
import {
	agentToolBindingKeys,
	agentWorkflowToolKeys,
	agentSkillAttachmentKeys,
	agentSubagentKeys,
} from './agents.keys';

// ─── Tool bindings ───────────────────────────────────────────

export const useAgentToolBindings = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentToolBindingKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentToolBindingService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useCreateAgentToolBinding = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateAgentToolBindingDto) => AgentToolBindingService.create(ws, agentId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentToolBindingKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to attach tool' },
	});
};

export const useDeleteAgentToolBinding = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentToolBindingService.remove(ws, agentId, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentToolBindingKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to remove tool' },
	});
};

// ─── Attached workflows ──────────────────────────────────────

export const useAgentWorkflowTools = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentWorkflowToolKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentWorkflowToolService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAttachAgentWorkflow = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (workflowId: string) => AgentWorkflowToolService.attach(ws, agentId, workflowId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentWorkflowToolKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to attach workflow' },
	});
};

export const useDetachAgentWorkflow = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (workflowId: string) => AgentWorkflowToolService.detach(ws, agentId, workflowId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentWorkflowToolKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to detach workflow' },
	});
};

// ─── Attached skills ─────────────────────────────────────────

export const useAgentSkillAttachments = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentSkillAttachmentKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentSkillAttachmentService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAttachAgentSkill = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (skillId: string) => AgentSkillAttachmentService.attach(ws, agentId, skillId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillAttachmentKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to attach skill' },
	});
};

export const useDetachAgentSkill = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (skillId: string) => AgentSkillAttachmentService.detach(ws, agentId, skillId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSkillAttachmentKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to detach skill' },
	});
};

// ─── Subagents ───────────────────────────────────────────────

export const useAgentSubagents = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentSubagentKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentSubagentService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useAttachSubagent = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (subagentId: string) => AgentSubagentService.attach(ws, agentId, subagentId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSubagentKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to add subagent' },
	});
};

export const useDetachSubagent = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (subagentId: string) => AgentSubagentService.detach(ws, agentId, subagentId),
		onSuccess: () => qc.invalidateQueries({ queryKey: agentSubagentKeys.list(ws, agentId) }),
		meta: { errorMessage: 'Failed to remove subagent' },
	});
};

/** Subagents a conversation started. Polls while any are still queued or running. */
export const useSubagentTasks = (ws: string, agentId: string, sessionId: string, enabled = true) =>
	useQuery({
		queryKey: agentSubagentKeys.tasks(ws, agentId, sessionId),
		queryFn: ({ signal }) => AgentSubagentService.tasks(ws, agentId, sessionId, signal),
		enabled: enabled && !!ws && !!agentId && !!sessionId,
		refetchInterval: (query) =>
			query.state.data?.some((task) => task.status === 'queued' || task.status === 'running')
				? 2000
				: false,
	});
