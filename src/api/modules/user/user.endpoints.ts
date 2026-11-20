// ============================================================
// User Endpoints
// ------------------------------------------------------------
// The current-user profile, plus avatar and workspace-switch, account
// deletion and personal data exports, and
// workspace-scoped API keys (issued for the current user's account,
// but each key is bound to one workspace).
// ============================================================
export const UserEndpoints = {
	me: '/user',
	update: '/user',
	destroy: '/user',
	cancelEmailChange: '/user/pending-email',
	switchWorkspace: '/user/switch-workspace',
	signupAttribution: '/user/signup-attribution',
	uploadAvatar: '/user/avatar',
	deleteAvatar: '/user/avatar',
	deletionCheck: '/user/deletion-blockers',
	dataExports: '/user/data-exports',
	dataExportDownload: (id: string) => `/user/data-exports/${id}/download`,

	apiKeys: (ws: string) => `/workspaces/${ws}/api-keys`,
	apiKey: (ws: string, id: string) => `/workspaces/${ws}/api-keys/${id}`,
} as const;
