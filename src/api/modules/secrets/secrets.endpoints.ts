export const SecretEndpoints = {
	list: (ws: string) => `/workspaces/${ws}/secrets`,
	create: (ws: string) => `/workspaces/${ws}/secrets`,
	detail: (ws: string, id: string) => `/workspaces/${ws}/secrets/${id}`,
	update: (ws: string, id: string) => `/workspaces/${ws}/secrets/${id}`,
	delete: (ws: string, id: string) => `/workspaces/${ws}/secrets/${id}`,
} as const;
