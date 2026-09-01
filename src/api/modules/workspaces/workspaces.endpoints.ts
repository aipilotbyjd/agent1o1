export const WorkspaceEndpoints = {
	list: '/workspaces',
	create: '/workspaces',
	switch: '/user/switch-workspace',
	detail: (id: string) => `/workspaces/${id}`,
	update: (id: string) => `/workspaces/${id}`,
	delete: (id: string) => `/workspaces/${id}`,
	leave: (id: string) => `/workspaces/${id}/leave`,
	members: (id: string) => `/workspaces/${id}/members`,
	updateMemberRole: (id: string, userId: string) => `/workspaces/${id}/members/${userId}`,
	removeMember: (id: string, userId: string) => `/workspaces/${id}/members/${userId}`,
	invitations: (id: string) => `/workspaces/${id}/invitations`,
	createInvitation: (id: string) => `/workspaces/${id}/invitations`,
	deleteInvitation: (id: string, invitationId: string) =>
		`/workspaces/${id}/invitations/${invitationId}`,
	acceptInvitation: (invitationId: string) => `/workspaces/invitations/${invitationId}/accept`,
} as const;
