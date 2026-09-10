// ============================================================
// Workspace Member / Invitation Endpoints
// ------------------------------------------------------------
// A member is addressed by user id, not a membership row id —
// `Route::patch('members/{member}', ...)` binds `{member}` to
// `User`. Accepting an invitation isn't workspace-scoped in the
// URL: the workspace comes from the invitation itself.
// ============================================================
export const WorkspaceMemberEndpoints = {
	list: (ws: string) => `/workspaces/${ws}/members`,
	updateRole: (ws: string, userId: string) => `/workspaces/${ws}/members/${userId}`,
	remove: (ws: string, userId: string) => `/workspaces/${ws}/members/${userId}`,

	invitations: (ws: string) => `/workspaces/${ws}/invitations`,
	invite: (ws: string) => `/workspaces/${ws}/invitations`,
	revokeInvitation: (ws: string, invitationId: string) =>
		`/workspaces/${ws}/invitations/${invitationId}`,
	acceptInvitation: (invitationId: string, query?: string) =>
		`/workspaces/invitations/${invitationId}/accept${query ? `?${query}` : ''}`,
} as const;
