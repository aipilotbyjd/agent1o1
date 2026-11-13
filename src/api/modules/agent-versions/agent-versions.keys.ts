export const agentVersionKeys = {
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'versions'] as const,
	detail: (ws: string, agentId: string, version: number) =>
		['agents', ws, agentId, 'versions', version] as const,
};
