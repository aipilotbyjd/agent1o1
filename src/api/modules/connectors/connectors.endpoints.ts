// ============================================================
// Connector Endpoints
// ------------------------------------------------------------
// `Connector` is the global catalog (not workspace-scoped);
// `ConnectorCredential` is workspace-scoped. OAuth is a third leg:
// `initiate` starts the redirect, and the provider's callback lands
// on a public route this app never calls directly.
// ============================================================
export const ConnectorEndpoints = {
	list: '/connectors',
	detail: (id: string) => `/connectors/${id}`,

	credentials: (ws: string) => `/workspaces/${ws}/connector-credentials`,
	credential: (ws: string, id: string) => `/workspaces/${ws}/connector-credentials/${id}`,
	setDefaultCredential: (ws: string, id: string) =>
		`/workspaces/${ws}/connector-credentials/${id}/default`,
	initiateOAuth: (ws: string) => `/workspaces/${ws}/connector-credentials/oauth/initiate`,
} as const;
