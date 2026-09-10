const base = (ws: string) => `/workspaces/${ws}/agents`;
const agent = (ws: string, id: string) => `${base(ws)}/${id}`;

export const AgentEndpoints = {
	list: base,
	create: base,
	detail: agent,
	update: agent,
	delete: agent,
	duplicate: (ws: string, id: string) => `${agent(ws, id)}/duplicate`,
	syncTags: (ws: string, id: string) => `${agent(ws, id)}/tags`,
} as const;

export const AgentSessionEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/sessions`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/sessions`,
	detail: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/sessions/${id}`,
	update: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/sessions/${id}`,
	delete: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/sessions/${id}`,
	messages: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/sessions/${id}/messages`,
	sendMessage: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/sessions/${id}/messages`,
	streamMessage: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/sessions/${id}/messages/stream`,
} as const;

export const AgentVersionEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/versions`,
	detail: (ws: string, agentId: string, version: number) => `${agent(ws, agentId)}/versions/${version}`,
	restore: (ws: string, agentId: string, version: number) =>
		`${agent(ws, agentId)}/versions/${version}/restore`,
} as const;

export const AgentToolBindingEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/tool-bindings`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/tool-bindings`,
	delete: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/tool-bindings/${id}`,
} as const;

export const AgentWorkflowToolEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/workflows`,
	attach: (ws: string, agentId: string, workflowId: string) =>
		`${agent(ws, agentId)}/workflows/${workflowId}`,
	detach: (ws: string, agentId: string, workflowId: string) =>
		`${agent(ws, agentId)}/workflows/${workflowId}`,
} as const;

export const AgentSkillAttachmentEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/skills`,
	attach: (ws: string, agentId: string, skillId: string) => `${agent(ws, agentId)}/skills/${skillId}`,
	detach: (ws: string, agentId: string, skillId: string) => `${agent(ws, agentId)}/skills/${skillId}`,
} as const;

export const AgentKnowledgeEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/knowledge`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/knowledge`,
	update: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/knowledge/${id}`,
	delete: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/knowledge/${id}`,
} as const;

export const AgentKnowledgeSourceEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/knowledge-sources`,
	attach: (ws: string, agentId: string, collection: string) =>
		`${agent(ws, agentId)}/knowledge-sources/${collection}`,
	detach: (ws: string, agentId: string, collection: string) =>
		`${agent(ws, agentId)}/knowledge-sources/${collection}`,
} as const;

export const AgentMemoryEndpoints = {
	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/memories`,
	create: (ws: string, agentId: string) => `${agent(ws, agentId)}/memories`,
	update: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/memories/${id}`,
	delete: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/memories/${id}`,
} as const;

export const AgentEvalEndpoints = {
	suites: (ws: string, agentId: string) => `${agent(ws, agentId)}/eval-suites`,
	createSuite: (ws: string, agentId: string) => `${agent(ws, agentId)}/eval-suites`,
	suite: (ws: string, agentId: string, suiteId: string) => `${agent(ws, agentId)}/eval-suites/${suiteId}`,
	updateSuite: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}`,
	deleteSuite: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}`,

	cases: (ws: string, agentId: string, suiteId: string) => `${agent(ws, agentId)}/eval-suites/${suiteId}/cases`,
	createCase: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/cases`,
	updateCase: (ws: string, agentId: string, suiteId: string, caseId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/cases/${caseId}`,
	deleteCase: (ws: string, agentId: string, suiteId: string, caseId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/cases/${caseId}`,

	runs: (ws: string, agentId: string, suiteId: string) => `${agent(ws, agentId)}/eval-suites/${suiteId}/runs`,
	createRun: (ws: string, agentId: string, suiteId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/runs`,
	run: (ws: string, agentId: string, suiteId: string, runId: string) =>
		`${agent(ws, agentId)}/eval-suites/${suiteId}/runs/${runId}`,
} as const;

export const AgentReflectionEndpoints = {
	settings: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-settings`,
	updateSettings: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-settings`,

	runs: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-runs`,
	createRun: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflection-runs`,
	run: (ws: string, agentId: string, runId: string) => `${agent(ws, agentId)}/reflection-runs/${runId}`,

	list: (ws: string, agentId: string) => `${agent(ws, agentId)}/reflections`,
	detail: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/reflections/${id}`,
	apply: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/reflections/${id}/apply`,
	dismiss: (ws: string, agentId: string, id: string) => `${agent(ws, agentId)}/reflections/${id}/dismiss`,
} as const;

export const AgentEvaluationEndpoints = {
	settings: (ws: string, agentId: string) => `${agent(ws, agentId)}/evaluation-settings`,
	updateSettings: (ws: string, agentId: string) => `${agent(ws, agentId)}/evaluation-settings`,

	sessionEvaluations: (ws: string, agentId: string) => `${agent(ws, agentId)}/session-evaluations`,
	sessionEvaluation: (ws: string, agentId: string, id: string) =>
		`${agent(ws, agentId)}/session-evaluations/${id}`,
	runOnSession: (ws: string, agentId: string, sessionId: string) =>
		`${agent(ws, agentId)}/sessions/${sessionId}/evaluation`,
} as const;
