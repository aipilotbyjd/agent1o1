export const agentToolBindingKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'tool-bindings'] as const,
};

export const agentWorkflowToolKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'workflows'] as const,
};

export const agentSubagentKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'subagents'] as const,
	tasks: (ws: string, agentId: string, sessionId: string) =>
		['agents', ws, agentId, 'sessions', sessionId, 'subagent-tasks'] as const,
};

export const agentSkillAttachmentKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'skills'] as const,
};
