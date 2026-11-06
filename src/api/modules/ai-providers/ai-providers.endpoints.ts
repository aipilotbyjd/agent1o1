export const AiProviderEndpoints = {
	providers: (ws: string) => `/workspaces/${ws}/ai-providers`,
	connect: (ws: string, provider: string) => `/workspaces/${ws}/ai-providers/${provider}/connect`,
	/** Not workspace-scoped: the workspace comes from the sign-in's `state`. */
	completeConnect: '/ai-providers/connect/complete',
	policy: (ws: string) => `/workspaces/${ws}/ai-key-policy`,
	policyPreview: (ws: string) => `/workspaces/${ws}/ai-key-policy/preview`,
	credentials: (ws: string) => `/workspaces/${ws}/ai-provider-credentials`,
	credential: (ws: string, id: string) => `/workspaces/${ws}/ai-provider-credentials/${id}`,
	setDefault: (ws: string, id: string) =>
		`/workspaces/${ws}/ai-provider-credentials/${id}/default`,
	restore: (ws: string, id: string) => `/workspaces/${ws}/ai-provider-credentials/${id}/restore`,
	validate: (ws: string, id: string) =>
		`/workspaces/${ws}/ai-provider-credentials/${id}/validate`,
} as const;
