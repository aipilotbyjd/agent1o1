const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentSessionEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/sessions`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/sessions`,
	detail: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/sessions/${id}`,
	update: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/sessions/${id}`,
	delete: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/sessions/${id}`,
	messages: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/sessions/${id}/messages`,
	subagentTasks: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/sessions/${id}/subagent-tasks`,
	sendMessage: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/sessions/${id}/messages`,
	/** Opens a turn whose reply streams over Reverb (`TAgentSessionStreamEvent`). */
	startTurn: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/sessions/${id}/turns`,
} as const;
