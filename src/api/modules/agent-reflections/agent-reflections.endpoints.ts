const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentReflectionEndpoints = {
	settings: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-settings`,
	updateSettings: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-settings`,

	runs: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-runs`,
	createRun: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-runs`,
	run: (ws: string, agentId: string, runId: string) =>
		`${agent(ws, agentId)}/reflection-runs/${runId}`,

	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflections`,
	detail: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/reflections/${id}`,
	apply: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/reflections/${id}/apply`,
	dismiss: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/reflections/${id}/dismiss`,
} as const;
