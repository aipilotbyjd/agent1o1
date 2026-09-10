export const NodeEndpoints = {
	globalCatalog: '/nodes',

	list: (ws: string) => `/workspaces/${ws}/nodes`,
	custom: (ws: string) => `/workspaces/${ws}/nodes/custom`,
	recentlyUsed: (ws: string) => `/workspaces/${ws}/nodes/recently-used`,
	create: (ws: string) => `/workspaces/${ws}/nodes`,
	detail: (ws: string, id: string) => `/workspaces/${ws}/nodes/${id}`,
	update: (ws: string, id: string) => `/workspaces/${ws}/nodes/${id}`,
	delete: (ws: string, id: string) => `/workspaces/${ws}/nodes/${id}`,
} as const;
