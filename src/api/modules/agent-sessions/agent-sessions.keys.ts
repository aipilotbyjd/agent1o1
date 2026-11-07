export const agentSessionKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'sessions'] as const,
	detail: (ws: string, agentId: string, id: string) =>
		['agents', ws, agentId, 'sessions', id] as const,
};
