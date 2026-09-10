import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TCreateAgentToolBindingDto } from '@/types/agent.type';
import { AgentToolBindingService, AgentWorkflowToolService, AgentSkillAttachmentService } from './agent-tools.service';
import { agentToolBindingKeys, agentWorkflowToolKeys, agentSkillAttachmentKeys } from './agents.keys';

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
