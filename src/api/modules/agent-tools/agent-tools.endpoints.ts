const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentToolBindingEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/tool-bindings`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/tool-bindings`,
	update: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/tool-bindings/${id}`,
	delete: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/tool-bindings/${id}`,
} as const;

export const AgentWorkflowToolEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/workflows`,
	attach: (ws: string, agentId: string, workflowId: string) =>
		`${agent(ws, agentId)}/workflows/${workflowId}`,
	/** Sets the approval rule for running the workflow as a tool. */
	update: (ws: string, agentId: string, workflowId: string) =>
		`${agent(ws, agentId)}/workflows/${workflowId}`,
	detach: (ws: string, agentId: string, workflowId: string) =>
		`${agent(ws, agentId)}/workflows/${workflowId}`,
} as const;

export const AgentSubagentEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/subagents`,
	attach: (ws: string, agentId: string, subagentId: string) =>
		`${agent(ws, agentId)}/subagents/${subagentId}`,
	detach: (ws: string, agentId: string, subagentId: string) =>
		`${agent(ws, agentId)}/subagents/${subagentId}`,
} as const;

export const AgentSkillAttachmentEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/skills`,
	attach: (ws: string, agentId: string, skillId: string) =>
		`${agent(ws, agentId)}/skills/${skillId}`,
	detach: (ws: string, agentId: string, skillId: string) =>
		`${agent(ws, agentId)}/skills/${skillId}`,
} as const;
