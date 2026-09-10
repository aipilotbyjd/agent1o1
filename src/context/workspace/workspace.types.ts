// ============================================================
// Workspace Context Types
// ============================================================
import type {
	TWorkspace,
	TWorkspaceDetail,
	TWorkspaceMember,
	TWorkspaceRole,
} from '@/types/workspace.type';

export interface IWorkspaceContextProps {
	// List of all accessible workspaces
	workspaces: TWorkspace[];
	isWorkspacesLoading: boolean;

	// Active workspace info
	activeWorkspaceId: string;
	activeWorkspace: TWorkspaceDetail | null;
	isActiveWorkspaceLoading: boolean;
	isActiveWorkspaceError: boolean;
	activeWorkspaceError: Error | null;

	// Active workspace settings, roles, members
	role: TWorkspaceRole | null;
	members: TWorkspaceMember[];
	isMembersLoading: boolean;

	// Utilities
	switchWorkspace: (idOrSlug: string) => void;
	refetchActiveWorkspace: () => void;
}
