// ============================================================
// Workspace Context Types
// ============================================================
import type { TWorkspace, TWorkspaceRole } from '@/types/workspace.type';

export interface IWorkspaceContextProps {
	// List of all accessible workspaces
	workspaces: TWorkspace[];
	isWorkspacesLoading: boolean;

	// Active workspace info
	activeWorkspaceId: string;
	activeWorkspace: TWorkspace | null;
	isActiveWorkspaceLoading: boolean;

	// Viewer's role on the active workspace
	role: TWorkspaceRole | null;
}
