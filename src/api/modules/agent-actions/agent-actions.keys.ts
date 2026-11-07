import type { TAgentActionListParams } from '@/types/agent-action.type';

export const agentActionKeys = {
	all: (ws: string) => ['agent-actions', ws] as const,
	inbox: (ws: string, params?: TAgentActionListParams) =>
		['agent-actions', ws, 'inbox', params ?? {}] as const,
	detail: (ws: string, id: string) => ['agent-actions', ws, 'detail', id] as const,
	forAgent: (ws: string, agentId: string, params?: TAgentActionListParams) =>
		['agents', ws, agentId, 'actions', params ?? {}] as const,
	/** Under the session's own key, so refreshing a conversation refreshes its cards. */
	forSession: (ws: string, agentId: string, sessionId: string) =>
		['agents', ws, agentId, 'sessions', sessionId, 'actions'] as const,
};

export const agentPlanKeys = {
	list: (ws: string, agentId: string, sessionId: string) =>
		['agents', ws, agentId, 'sessions', sessionId, 'plans'] as const,
};

export const agentTrustKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'trust-suggestions'] as const,
};

export const workspaceAgentPolicyKeys = {
	detail: (ws: string) => ['workspace-agent-policy', ws] as const,
};
