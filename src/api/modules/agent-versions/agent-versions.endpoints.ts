const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentVersionEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/versions`,
	detail: (ws: string, agentId: string, version: number) =>
		`${agent(ws, agentId)}/versions/${version}`,
	restore: (ws: string, agentId: string, version: number) =>
		`${agent(ws, agentId)}/versions/${version}/restore`,
} as const;
