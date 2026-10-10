const base = (ws: string) => `/workspaces/${ws}/workflow-builder-sessions`;
const session = (ws: string, id: string) => `${base(ws)}/${id}`;

export const WorkflowBuilderEndpoints = {
	list: base,
	create: base,
	detail: session,
	update: session,
	delete: session,
	syncDraft: (ws: string, id: string) => `${session(ws, id)}/draft`,
	promote: (ws: string, id: string) => `${session(ws, id)}/promote`,
	messages: (ws: string, sessionId: string) => `${session(ws, sessionId)}/messages`,
	message: (ws: string, sessionId: string, messageId: string) =>
		`${session(ws, sessionId)}/messages/${messageId}`,
	versions: (ws: string, sessionId: string) => `${session(ws, sessionId)}/versions`,
	restoreVersion: (ws: string, sessionId: string, versionId: string) =>
		`${session(ws, sessionId)}/versions/${versionId}/restore`,
	assist: (
		ws: string,
		sessionId: string,
		helper: 'suggest-nodes' | 'configure-node' | 'explain' | 'suggest-improvements',
	) => `${session(ws, sessionId)}/assist/${helper}`,
} as const;

export const WorkflowDiagnosticsEndpoints = {
	validate: (ws: string, workflowId: string) =>
		`/workspaces/${ws}/workflows/${workflowId}/validate`,
	dryRun: (ws: string, workflowId: string) => `/workspaces/${ws}/workflows/${workflowId}/dry-run`,
	testNode: (ws: string, workflowId: string, nodeId: string) =>
		`/workspaces/${ws}/workflows/${workflowId}/nodes/${nodeId}/test`,
	replaceGraph: (ws: string, workflowId: string) =>
		`/workspaces/${ws}/workflows/${workflowId}/graph`,
} as const;
