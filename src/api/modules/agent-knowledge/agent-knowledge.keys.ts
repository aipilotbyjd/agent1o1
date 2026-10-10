export const agentKnowledgeKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'knowledge'] as const,
};

export const agentKnowledgeSourceKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'knowledge-sources'] as const,
};
