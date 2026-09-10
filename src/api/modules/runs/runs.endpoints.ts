const base = (ws: string) => `/workspaces/${ws}/runs`;
const run = (ws: string, id: string) => `${base(ws)}/${id}`;

export const RunEndpoints = {
	start: (ws: string, workflowId: string) => `/workspaces/${ws}/workflows/${workflowId}/runs`,
	list: base,
	detail: run,
	cancel: (ws: string, id: string) => `${run(ws, id)}/cancel`,
	retry: (ws: string, id: string) => `${run(ws, id)}/retry`,

	nodeRuns: (ws: string, runId: string) => `${run(ws, runId)}/node-runs`,
	nodeRun: (ws: string, runId: string, nodeRunId: string) => `${run(ws, runId)}/node-runs/${nodeRunId}`,

	decideApproval: (ws: string, runId: string, approvalId: string) =>
		`${run(ws, runId)}/approvals/${approvalId}/decide`,
} as const;
