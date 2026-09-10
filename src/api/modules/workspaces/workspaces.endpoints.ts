// ============================================================
// Workspace Endpoints
// ------------------------------------------------------------
// There is no workspace-avatar upload endpoint on the real backend
// — `avatar` is a plain column with no dedicated route. `leave` is
// nested under the workspace root, not under `members`.
// ============================================================
export const WorkspaceEndpoints = {
	list: '/workspaces',
	create: '/workspaces',
	detail: (id: string) => `/workspaces/${id}`,
	update: (id: string) => `/workspaces/${id}`,
	delete: (id: string) => `/workspaces/${id}`,
	leave: (id: string) => `/workspaces/${id}/leave`,
} as const;
