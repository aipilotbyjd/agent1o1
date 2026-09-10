// ============================================================
// Workspace Query Keys
// ------------------------------------------------------------
// Workspaces have no parent scope, so these skip the `ws` argument
// that createKeys() bakes in for resources nested under a workspace.
// ============================================================
export const workspaceKeys = {
	all: () => ['workspaces'] as const,
	lists: () => ['workspaces', 'list'] as const,
	details: () => ['workspaces', 'detail'] as const,
	detail: (id: string) => ['workspaces', 'detail', id] as const,
};
