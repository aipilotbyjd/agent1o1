const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentKnowledgeEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/knowledge`,
	attach: (ws: string, agentId: string, collection: string) =>
		`${agent(ws, agentId)}/knowledge/${encodeURIComponent(collection)}`,
	update: (ws: string, agentId: string, collection: string) =>
		`${agent(ws, agentId)}/knowledge/${encodeURIComponent(collection)}`,
	detach: (ws: string, agentId: string, collection: string) =>
		`${agent(ws, agentId)}/knowledge/${encodeURIComponent(collection)}`,
} as const;
