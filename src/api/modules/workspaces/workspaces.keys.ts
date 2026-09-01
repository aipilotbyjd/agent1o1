export const workspaceKeys = {
	all: () => ['workspaces'] as const,
	list: () => ['workspaces', 'list'] as const,
	detail: (id: string) => ['workspaces', 'detail', id] as const,
	members: (id: string) => ['workspaces', id, 'members'] as const,
	invitations: (id: string) => ['workspaces', id, 'invitations'] as const,
};
