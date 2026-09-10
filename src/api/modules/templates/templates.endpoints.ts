const ws = (workspace: string) => `/workspaces/${workspace}`;

export const WorkflowTemplateEndpoints = {
	list: (w: string) => `${ws(w)}/workflow-templates`,
	create: (w: string) => `${ws(w)}/workflow-templates`,
	detail: (w: string, id: string) => `${ws(w)}/workflow-templates/${id}`,
	update: (w: string, id: string) => `${ws(w)}/workflow-templates/${id}`,
	delete: (w: string, id: string) => `${ws(w)}/workflow-templates/${id}`,
	use: (w: string, id: string) => `${ws(w)}/workflow-templates/${id}/use`,
	saveWorkflowAsTemplate: (w: string, workflowId: string) =>
		`${ws(w)}/workflows/${workflowId}/save-as-template`,
} as const;

export const AgentTemplateEndpoints = {
	list: (w: string) => `${ws(w)}/agent-templates`,
	create: (w: string) => `${ws(w)}/agent-templates`,
	detail: (w: string, id: string) => `${ws(w)}/agent-templates/${id}`,
	update: (w: string, id: string) => `${ws(w)}/agent-templates/${id}`,
	delete: (w: string, id: string) => `${ws(w)}/agent-templates/${id}`,
	use: (w: string, id: string) => `${ws(w)}/agent-templates/${id}/use`,
	saveAgentAsTemplate: (w: string, agentId: string) => `${ws(w)}/agents/${agentId}/save-as-template`,
} as const;

export const TemplateCollectionEndpoints = {
	list: (w: string) => `${ws(w)}/template-collections`,
	create: (w: string) => `${ws(w)}/template-collections`,
	detail: (w: string, id: string) => `${ws(w)}/template-collections/${id}`,
	update: (w: string, id: string) => `${ws(w)}/template-collections/${id}`,
	delete: (w: string, id: string) => `${ws(w)}/template-collections/${id}`,
	use: (w: string, id: string) => `${ws(w)}/template-collections/${id}/use`,
	addItem: (w: string, id: string) => `${ws(w)}/template-collections/${id}/items`,
	reorderItems: (w: string, id: string) => `${ws(w)}/template-collections/${id}/items/reorder`,
	removeItem: (w: string, id: string, itemId: string) =>
		`${ws(w)}/template-collections/${id}/items/${itemId}`,
} as const;
