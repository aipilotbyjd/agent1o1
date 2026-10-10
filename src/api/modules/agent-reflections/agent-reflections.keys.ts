export const agentReflectionKeys = {
	settings: (ws: string, agentId: string) =>
		['agents', ws, agentId, 'reflection-settings'] as const,
	runs: (ws: string, agentId: string) => ['agents', ws, agentId, 'reflection-runs'] as const,
	run: (ws: string, agentId: string, runId: string) =>
		['agents', ws, agentId, 'reflection-runs', runId] as const,
	list: (ws: string, agentId: string) => ['agents', ws, agentId, 'reflections'] as const,
	detail: (ws: string, agentId: string, id: string) =>
		['agents', ws, agentId, 'reflections', id] as const,
};
