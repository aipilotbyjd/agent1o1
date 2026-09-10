const base = (ws: string) => `/workspaces/${ws}/workflow-builder-sessions`;
const session = (ws: string, id: string) => `${base(ws)}/${id}`;

export const WorkflowBuilderEndpoints = {
	list: base,
	create: base,
	detail: session,
	delete: session,
	promote: (ws: string, id: string) => `${session(ws, id)}/promote`,
	// There is no messages-list route — the session's `show` response is
	// the only place the transcript is read back (eager-loaded).
	sendMessage: (ws: string, sessionId: string) => `${session(ws, sessionId)}/messages`,
} as const;

export const WorkflowDiagnosticsEndpoints = {
	validate: (ws: string, workflowId: string) => `/workspaces/${ws}/workflows/${workflowId}/validate`,
	dryRun: (ws: string, workflowId: string) => `/workspaces/${ws}/workflows/${workflowId}/dry-run`,
	testNode: (ws: string, workflowId: string, nodeId: string) =>
		`/workspaces/${ws}/workflows/${workflowId}/nodes/${nodeId}/test`,
	replaceGraph: (ws: string, workflowId: string) => `/workspaces/${ws}/workflows/${workflowId}/graph`,
} as const;
