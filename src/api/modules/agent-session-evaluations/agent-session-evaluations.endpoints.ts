const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentSessionEvaluationEndpoints = {
	settings: (ws: string, agentId: string) => `${agent(ws, agentId)}/evaluation-settings`,
	updateSettings: (ws: string, agentId: string) => `${agent(ws, agentId)}/evaluation-settings`,

	sessionEvaluations: (ws: string, agentId: string) =>
		`${agent(ws, agentId)}/session-evaluations`,
	sessionEvaluation: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/session-evaluations/${id}`,
	runOnSession: (ws: string, agentId: string, sessionId: string) =>
		`${agent(ws, agentId)}/sessions/${sessionId}/evaluation`,
} as const;
