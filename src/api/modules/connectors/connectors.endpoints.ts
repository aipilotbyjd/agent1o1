// ============================================================
// Connector Endpoints
// ------------------------------------------------------------
// `Connector` is the global catalog (not workspace-scoped);
// `ConnectorCredential` is workspace-scoped. OAuth is a third leg:
// `initiate` starts the redirect, and `completeOAuth` finishes it from
// the page the provider sends the browser back to, signed in as the
// member who started it.
// ============================================================
export const ConnectorEndpoints = {
	list: '/connectors',
	detail: (id: string) => `/connectors/${id}`,

	credentials: (ws: string) => `/workspaces/${ws}/connector-credentials`,
	credential: (ws: string, id: string) => `/workspaces/${ws}/connector-credentials/${id}`,
	setDefaultCredential: (ws: string, id: string) =>
		`/workspaces/${ws}/connector-credentials/${id}/default`,
	testCredential: (ws: string, id: string) =>
		`/workspaces/${ws}/connector-credentials/${id}/test`,
	credentialUsage: (ws: string, id: string) =>
		`/workspaces/${ws}/connector-credentials/${id}/usage`,
	initiateOAuth: (ws: string) => `/workspaces/${ws}/connector-credentials/oauth/initiate`,
	/** Not workspace-scoped: the workspace comes from the sign-in's `state`. */
	completeOAuth: '/connector-credentials/oauth/complete',
} as const;
