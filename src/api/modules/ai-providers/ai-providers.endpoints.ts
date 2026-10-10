export const AiProviderEndpoints = {
	providers: (ws: string) => `/workspaces/${ws}/ai-providers`,
	credentials: (ws: string) => `/workspaces/${ws}/ai-provider-credentials`,
	credential: (ws: string, id: string) => `/workspaces/${ws}/ai-provider-credentials/${id}`,
	setDefault: (ws: string, id: string) =>
		`/workspaces/${ws}/ai-provider-credentials/${id}/default`,
	validate: (ws: string, id: string) =>
		`/workspaces/${ws}/ai-provider-credentials/${id}/validate`,
} as const;
