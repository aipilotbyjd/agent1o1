const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentMemoryEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/memories`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/memories`,
	update: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/memories/${id}`,
	delete: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/memories/${id}`,
} as const;
