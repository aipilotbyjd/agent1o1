// No detail route — folders are only ever listed (as a tree), created,
// updated, deleted, or bulk-reassigned via moveWorkflows/moveAgents.
export const FolderEndpoints = {
	list: (ws: string) => `/workspaces/${ws}/folders`,
	create: (ws: string) => `/workspaces/${ws}/folders`,
	update: (ws: string, id: string) => `/workspaces/${ws}/folders/${id}`,
	delete: (ws: string, id: string) => `/workspaces/${ws}/folders/${id}`,
	moveWorkflows: (ws: string) => `/workspaces/${ws}/folders/move-workflows`,
	moveAgents: (ws: string) => `/workspaces/${ws}/folders/move-agents`,
} as const;
