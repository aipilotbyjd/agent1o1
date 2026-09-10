export const workspaceMemberKeys = {
	list: (ws: string) => ['workspace-members', ws] as const,
	invitations: (ws: string) => ['workspace-members', ws, 'invitations'] as const,
};
