export const agentMemoryKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'memories'] as const,
};
