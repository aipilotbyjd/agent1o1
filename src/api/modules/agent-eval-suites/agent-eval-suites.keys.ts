export const agentEvalSuiteKeys = {
	suites: (ws: string, agentId: string) => ['agents', ws, agentId, 'eval-suites'] as const,
	suite: (ws: string, agentId: string, suiteId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId] as const,
	cases: (ws: string, agentId: string, suiteId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId, 'cases'] as const,
	runs: (ws: string, agentId: string, suiteId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId, 'runs'] as const,
	run: (ws: string, agentId: string, suiteId: string, runId: string) =>
		['agents', ws, agentId, 'eval-suites', suiteId, 'runs', runId] as const,
};
