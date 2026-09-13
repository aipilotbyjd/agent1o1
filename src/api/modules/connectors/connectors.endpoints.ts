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

/**
 * Where the provider sends the user back after consent. It has to be the
 * backend's own route — the code-for-token exchange needs the client secret,
 * so only the server can complete it — which is why this is derived from the
 * API origin rather than being a page in this app.
 *
 * `VITE_API_URL` points at the versioned internal API (`.../api/v1`) while
 * this route sits one level up at `/api/oauth/...`, hence the trim.
 */
export const connectorOAuthRedirectUri = (apiBaseUrl: string): string =>
	`${apiBaseUrl.replace(/\/v\d+\/?$/, '')}/oauth/connectors/callback`;
