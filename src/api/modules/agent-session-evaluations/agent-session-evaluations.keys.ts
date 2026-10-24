export const agentSessionEvaluationKeys = {
	settings: (ws: string, agentId: string) =>
		['agents', ws, agentId, 'evaluation-settings'] as const,
	sessionEvaluations: (ws: string, agentId: string, params?: { grade?: string; page?: number }) =>
		['agents', ws, agentId, 'session-evaluations', params ?? {}] as const,
	sessionEvaluation: (ws: string, agentId: string, id: string) =>
		['agents', ws, agentId, 'session-evaluations', id] as const,
};
