const ws_ = (ws: string) => `/workspaces/${ws}`;
const agent = (ws: string, agentId: string) => `${ws_(ws)}/agents/${agentId}`;
const session = (ws: string, agentId: string, sessionId: string) =>
	`${agent(ws, agentId)}/sessions/${sessionId}`;

export const AgentActionEndpoints = {
	/** The approvals inbox across every agent in the workspace. */
	inbox: (ws: string) => `${ws_(ws)}/agent-actions`,
	detail: (ws: string, id: string) => `${ws_(ws)}/agent-actions/${id}`,
	decide: (ws: string) => `${ws_(ws)}/agent-actions/decisions`,

	/** One agent's full action log. */
	forAgent: (ws: string, agentId: string) => `${agent(ws, agentId)}/actions`,
	/** A conversation's actions (its subagents' included) — the chat's approval cards. */
	forSession: (ws: string, agentId: string, sessionId: string) =>
		`${session(ws, agentId, sessionId)}/actions`,
	/** Deciding from the chat — says whether the paused turn resumed; its reply streams over Reverb. */
	decideInChat: (ws: string, agentId: string, sessionId: string) =>
		`${session(ws, agentId, sessionId)}/actions/decisions`,
} as const;

export const AgentPlanEndpoints = {
	list: (ws: string, agentId: string, sessionId: string) =>
		`${session(ws, agentId, sessionId)}/plans`,
	approve: (ws: string, agentId: string, sessionId: string, planId: string) =>
		`${session(ws, agentId, sessionId)}/plans/${planId}/approve`,
	reject: (ws: string, agentId: string, sessionId: string, planId: string) =>
		`${session(ws, agentId, sessionId)}/plans/${planId}/reject`,
} as const;

export const AgentTrustEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/trust-suggestions`,
	apply: (ws: string, agentId: string) => `${agent(ws, agentId)}/trust-suggestions/apply`,
} as const;

export const WorkspaceAgentPolicyEndpoints = {
	detail: (ws: string) => `${ws_(ws)}/agent-policy`,
	update: (ws: string) => `${ws_(ws)}/agent-policy`,
} as const;
