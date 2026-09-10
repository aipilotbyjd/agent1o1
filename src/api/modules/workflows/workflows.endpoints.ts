const base = (ws: string) => `/workspaces/${ws}/workflows`;
const workflow = (ws: string, id: string) => `${base(ws)}/${id}`;

export const WorkflowEndpoints = {
	list: base,
	create: base,
	detail: workflow,
	update: workflow,
	delete: workflow,
	duplicate: (ws: string, id: string) => `${workflow(ws, id)}/duplicate`,
	syncTags: (ws: string, id: string) => `${workflow(ws, id)}/tags`,

	pinNode: (ws: string, id: string, nodeId: string) => `${workflow(ws, id)}/nodes/${nodeId}/pin`,
	unpinNode: (ws: string, id: string, nodeId: string) => `${workflow(ws, id)}/nodes/${nodeId}/pin`,
} as const;

export const WorkflowVersionEndpoints = {
	list: (ws: string, workflowId: string) => `${workflow(ws, workflowId)}/versions`,
	publish: (ws: string, workflowId: string) => `${workflow(ws, workflowId)}/versions`,
	detail: (ws: string, workflowId: string, version: string) =>
		`${workflow(ws, workflowId)}/versions/${version}`,
} as const;

export const WorkflowInterfaceEndpoints = {
	show: (ws: string, workflowId: string) => `${workflow(ws, workflowId)}/interface`,
	update: (ws: string, workflowId: string) => `${workflow(ws, workflowId)}/interface`,
	submit: (ws: string, workflowId: string) => `${workflow(ws, workflowId)}/interface/runs`,
} as const;
