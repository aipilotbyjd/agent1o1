// No detail route — tags are only ever listed, created, updated, or deleted.
export const TagEndpoints = {
	list: (ws: string) => `/workspaces/${ws}/tags`,
	create: (ws: string) => `/workspaces/${ws}/tags`,
	update: (ws: string, id: string) => `/workspaces/${ws}/tags/${id}`,
	delete: (ws: string, id: string) => `/workspaces/${ws}/tags/${id}`,
} as const;
