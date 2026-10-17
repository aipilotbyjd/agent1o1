const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentKnowledgeEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/knowledge`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/knowledge`,
	update: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/knowledge/${id}`,
	delete: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/knowledge/${id}`,
} as const;

export const AgentKnowledgeSourceEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/knowledge-sources`,
	attach: (ws: string, agentId: string, collection: string) =>
		`${agent(ws, agentId)}/knowledge-sources/${encodeURIComponent(collection)}`,
	detach: (ws: string, agentId: string, collection: string) =>
		`${agent(ws, agentId)}/knowledge-sources/${encodeURIComponent(collection)}`,
} as const;
