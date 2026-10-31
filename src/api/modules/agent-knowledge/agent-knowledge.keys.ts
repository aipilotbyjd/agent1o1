export const agentKnowledgeKeys = {
	/** Every agent's: what they report changes when the knowledge base does. */
	all: (ws: string) => ['agents', ws, 'knowledge'] as const,
	list: (ws: string, agentId: string) => ['agents', ws, 'knowledge', agentId] as const,
};
