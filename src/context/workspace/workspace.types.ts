// ============================================================
// Workspace Context Types
// ============================================================
import type { TWorkspace } from '@/types/workspace.type';

export interface IWorkspaceContextProps {
	activeWorkspaceId: string;
	activeWorkspace: TWorkspace | null;
	workspaces: TWorkspace[];
	isLoading: boolean;
	isSwitching: boolean;
	hasWorkspace: boolean;
	switchWorkspace: (id: string) => Promise<void>;
}
