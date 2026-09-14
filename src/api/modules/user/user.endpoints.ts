// ============================================================
// User Endpoints
// ------------------------------------------------------------
// The current-user profile, plus avatar and workspace-switch, and
// workspace-scoped API keys (issued for the current user's account,
// but each key is bound to one workspace).
// ============================================================
export const UserEndpoints = {
	me: '/user',
	update: '/user',
	destroy: '/user',
	switchWorkspace: '/user/switch-workspace',
	uploadAvatar: '/user/avatar',
	deleteAvatar: '/user/avatar',

	apiKeys: (ws: string) => `/workspaces/${ws}/api-keys`,
	apiKey: (ws: string, id: string) => `/workspaces/${ws}/api-keys/${id}`,
} as const;
