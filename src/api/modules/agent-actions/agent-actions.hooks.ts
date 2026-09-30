import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type {
	TAgentActionListParams,
	TApproveAgentPlanDto,
	TDecideAgentActionsDto,
	TRejectAgentPlanDto,
	TUpdateWorkspaceAgentPolicyDto,
} from '@/types/agent-action.type';
import { agentToolBindingKeys, agentWorkflowToolKeys } from '@/api/modules/agents/agents.keys';
import { dashboardKeys } from '@/api/modules/dashboard/dashboard.keys';
import {
	AgentActionService,
	AgentPlanService,
	AgentTrustService,
	WorkspaceAgentPolicyService,
} from './agent-actions.service';
import {
	agentActionKeys,
	agentPlanKeys,
	agentTrustKeys,
	workspaceAgentPolicyKeys,
} from './agent-actions.keys';

// ─── Actions ─────────────────────────────────────────────────

/** The approvals inbox — pending by default, any status for the full log. */
export const useAgentActionInbox = (ws: string, params?: TAgentActionListParams) =>
	useQuery({
		queryKey: agentActionKeys.inbox(ws, params),
		queryFn: ({ signal }) => AgentActionService.inbox(ws, params, signal),
		enabled: !!ws,
		placeholderData: keepPreviousData,
	});

export const useAgentActions = (ws: string, agentId: string, params?: TAgentActionListParams) =>
	useQuery({
		queryKey: agentActionKeys.forAgent(ws, agentId, params),
		queryFn: ({ signal }) => AgentActionService.forAgent(ws, agentId, params, signal),
		enabled: !!ws && !!agentId,
		placeholderData: keepPreviousData,
	});

export const useSessionAgentActions = (ws: string, agentId: string, sessionId: string | null) =>
	useQuery({
		queryKey: agentActionKeys.forSession(ws, agentId, sessionId ?? ''),
		queryFn: ({ signal }) =>
			AgentActionService.forSession(ws, agentId, sessionId ?? '', signal),
		enabled: !!ws && !!agentId && !!sessionId,
	});

/** Decides from the inbox (or anywhere outside an open chat). */
export const useDecideAgentActions = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TDecideAgentActionsDto) => AgentActionService.decide(ws, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: agentActionKeys.all(ws) });
			qc.invalidateQueries({ queryKey: ['agents', ws] });
			qc.invalidateQueries({ queryKey: dashboardKeys.overview(ws) });
		},
		meta: { errorMessage: 'Failed to record the decision' },
	});
};

// ─── Plans ───────────────────────────────────────────────────

export const useAgentPlans = (ws: string, agentId: string, sessionId: string | null) =>
	useQuery({
		queryKey: agentPlanKeys.list(ws, agentId, sessionId ?? ''),
		queryFn: ({ signal }) => AgentPlanService.list(ws, agentId, sessionId ?? '', signal),
		enabled: !!ws && !!agentId && !!sessionId,
	});

export const useApproveAgentPlan = (ws: string, agentId: string, sessionId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ planId, body }: { planId: string; body?: TApproveAgentPlanDto }) =>
			AgentPlanService.approve(ws, agentId, sessionId, planId, body),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: agentPlanKeys.list(ws, agentId, sessionId) }),
		meta: { errorMessage: 'Failed to approve the plan' },
	});
};

export const useRejectAgentPlan = (ws: string, agentId: string, sessionId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ planId, body }: { planId: string; body?: TRejectAgentPlanDto }) =>
			AgentPlanService.reject(ws, agentId, sessionId, planId, body),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: agentPlanKeys.list(ws, agentId, sessionId) }),
		meta: { errorMessage: 'Failed to reject the plan' },
	});
};

// ─── Trust suggestions ───────────────────────────────────────

export const useAgentTrustSuggestions = (ws: string, agentId: string) =>
	useQuery({
		queryKey: agentTrustKeys.list(ws, agentId),
		queryFn: ({ signal }) => AgentTrustService.list(ws, agentId, signal),
		enabled: !!ws && !!agentId,
	});

export const useApplyAgentTrustSuggestion = (ws: string, agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (toolName: string) => AgentTrustService.apply(ws, agentId, toolName),
		onSuccess: (suggestions) => {
			qc.setQueryData(agentTrustKeys.list(ws, agentId), suggestions);
			qc.invalidateQueries({ queryKey: agentToolBindingKeys.list(ws, agentId) });
			qc.invalidateQueries({ queryKey: agentWorkflowToolKeys.list(ws, agentId) });
		},
		meta: { errorMessage: 'Failed to update the tool rule' },
	});
};

// ─── Workspace policy ────────────────────────────────────────

export const useWorkspaceAgentPolicy = (ws: string) =>
	useQuery({
		queryKey: workspaceAgentPolicyKeys.detail(ws),
		queryFn: ({ signal }) => WorkspaceAgentPolicyService.detail(ws, signal),
		enabled: !!ws,
	});

export const useUpdateWorkspaceAgentPolicy = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TUpdateWorkspaceAgentPolicyDto) =>
			WorkspaceAgentPolicyService.update(ws, payload),
		onSuccess: (policy) => qc.setQueryData(workspaceAgentPolicyKeys.detail(ws), policy),
		meta: { errorMessage: 'Failed to update the agent policy' },
	});
};
