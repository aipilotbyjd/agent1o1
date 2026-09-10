import { useMemo, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { useWorkspaces, useWorkspace } from '@/api/modules/workspaces';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import type { TWorkspaceRole } from '@/types/workspace.type';
import WorkspaceContext from './WorkspaceContext';
import type { IWorkspaceContextProps } from './workspace.types';

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated, userData } = useAuth();
	const activeWorkspaceKey = useWorkflowShellStore((store) => store.activeWorkspaceId);
	const setActiveWorkspaceId = useWorkflowShellStore((store) => store.setActiveWorkspaceId);

	// Get all workspaces (only enabled when authenticated)
	const { data: workspaces = [], isLoading: isWorkspacesLoading } = useWorkspaces({
		enabled: isAuthenticated,
	});

	// Find workspace matched by active key in Zustand store
	const selectedWorkspace = useMemo(() => {
		if (workspaces.length === 0) return null;
		const matched = workspaces.find((workspace) => workspace.id === activeWorkspaceKey);
		if (matched) return matched;

		// Fallback to current_workspace_id
		const currentId = userData?.current_workspace_id;
		if (currentId) {
			const currentMatched = workspaces.find((w) => w.id === currentId);
			if (currentMatched) return currentMatched;
		}

		return workspaces[0];
	}, [activeWorkspaceKey, workspaces, userData]);

	// Determine active workspace ID
	const workspaceId = useMemo(() => {
		if (!isAuthenticated || isWorkspacesLoading) return '';
		if (activeWorkspaceKey && workspaces.some((w) => w.id === activeWorkspaceKey)) {
			return activeWorkspaceKey;
		}
		return userData?.current_workspace_id ?? selectedWorkspace?.id ?? '';
	}, [isAuthenticated, isWorkspacesLoading, userData, selectedWorkspace, activeWorkspaceKey, workspaces]);

	// Synchronize computed workspaceId back to Zustand store
	useEffect(() => {
		if (workspaceId && activeWorkspaceKey !== workspaceId) {
			setActiveWorkspaceId(workspaceId);
		}
	}, [workspaceId, activeWorkspaceKey, setActiveWorkspaceId]);

	// Fetch detailed active workspace record
	const { data: activeWorkspace, isLoading: isActiveWorkspaceLoading } = useWorkspace(workspaceId);

	// Determine user's role in active workspace — `role` on TWorkspace is
	// always the viewer's own role, set server-side from the membership pivot.
	const role = useMemo<TWorkspaceRole | null>(() => {
		return activeWorkspace?.role ?? selectedWorkspace?.role ?? null;
	}, [activeWorkspace, selectedWorkspace]);

	const value: IWorkspaceContextProps = useMemo(
		() => ({
			workspaces,
			isWorkspacesLoading,
			activeWorkspaceId: workspaceId,
			activeWorkspace: activeWorkspace ?? null,
			isActiveWorkspaceLoading: isWorkspacesLoading || isActiveWorkspaceLoading,
			role,
		}),
		[workspaces, isWorkspacesLoading, workspaceId, activeWorkspace, isActiveWorkspaceLoading, role],
	);

	return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
