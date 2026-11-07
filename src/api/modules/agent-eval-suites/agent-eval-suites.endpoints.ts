const agent = (ws: string, id: string) => `/workspaces/${ws}/agents/${id}`;

export const AgentEvalSuiteEndpoints = {
	suites: (ws: string, agentId: string) => `${agent(ws, agentId)}/eval-suites`,
	createSuite: (ws: string, agentId: string) => `${agent(ws, agentId)}/eval-suites`,
	suite: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}`,
	updateSuite: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}`,
	deleteSuite: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}`,

	cases: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/cases`,
	createCase: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/cases`,
	updateCase: (ws: string, agentId: string, suiteId: string, caseId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/cases/${caseId}`,
	deleteCase: (ws: string, agentId: string, suiteId: string, caseId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/cases/${caseId}`,

	runs: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/runs`,
	createRun: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/runs`,
	run: (ws: string, agentId: string, suiteId: string, runId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/runs/${runId}`,
} as const;
